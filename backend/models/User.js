
import bcrypt from 'bcrypt';
import dynamo from 'dynamodb';
import emailValidator from 'email-validator';
import Joi from 'joi';
import memoize from 'memoizee';
import { getCategories } from './News.js';
import owasp from 'owasp-password-strength-test';
import { BadRequest, Conflict, NotFound } from '../error/errors.js';
import {
  assertString, checkThrowAWSError,
  queryGetList, queryGetListPageLimit,
} from '../util/utils.js';
import { Friendship } from './Friendship.js';
import { recommendArticles } from '../jobs/recommend-articles.js';
import { redisClient } from './connect.js';


export const Affiliation = dynamo.define('Affiliation', {
  hashKey: 'affiliation',
  schema: {
    affiliation: Joi.string(),
  },
});

export const User = dynamo.define('User', {
  hashKey: 'username',
  schema: {
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    passwordHash: Joi.string(),
    emailAddress: Joi.string(),
    affiliation: Joi.string(),
    interests: dynamo.types.stringSet(),
    onlineStatus: Joi.boolean(),
  },
});

export const UserAutocomplete = dynamo.define('UserAutocomplete', {
  hashKey: 'prefix',
  rangeKey: 'username',
  schema: {
    prefix: Joi.string(),
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
  },
});

/**
 * @return {Set} a set of valid affiliations
 */
const getAffiliationsUnmemoized = async function() {
  const affiliationsSet = new Set();
  const data = await queryGetList(Affiliation.scan().loadAll());
  data.forEach(({ affiliation }) => affiliationsSet.add(affiliation));
  return affiliationsSet;
};

export const getAffiliations = memoize(getAffiliationsUnmemoized, { maxAge: 1000 * 60 * 60 });

const isValidUsername = /^[a-zA-Z0-9-_]+$/;
/**
 * Validates a user profile provided by a create or update user request.
 * @param {Object} profile the request body of a create or update user request
 * @param {Object} keysToCheck (optional) the keys to check during validation
 * @return {Object} an object containing only valid profile fields from profile
 */
export async function validateUserProfile(profile, keysToCheck) {
  const {
    username, password, firstName, lastName, emailAddress, affiliation, interests,
  } = profile;
  const validatedProfile = {};

  if (!keysToCheck || 'username' in keysToCheck) {
    assertString(username, 'username', 50, 5);
    if (!isValidUsername.test(username)) {
      throw new BadRequest('The given username is invalid (must pass /^[a-zA-Z0-9-_]+$/).');
    }
    validatedProfile.username = username;
  }

  if (!keysToCheck || 'firstName' in keysToCheck) {
    assertString(firstName, 'firstName', 50, 1);
    validatedProfile.firstName = firstName;
  }

  if (!keysToCheck || 'lastName' in keysToCheck) {
    assertString(lastName, 'lastName', 50);
    validatedProfile.lastName = lastName;
  }

  if (!keysToCheck || 'emailAddress' in keysToCheck) {
    assertString(emailAddress, 'emailAddress', 254);
    if (!emailValidator.validate(emailAddress)) {
      throw new BadRequest('Invalid email address: ' + emailAddress);
    }
    validatedProfile.emailAddress = emailAddress;
  }

  if (!keysToCheck || 'password' in keysToCheck) {
    assertString(password, 'password');
    if (!owasp.test(password).strong) {
      throw new BadRequest('Password does not meet strength requirements.');
    }
    validatedProfile.passwordHash = await bcrypt.hash(password,
        parseInt(process.env.PASSWORD_SALT_ROUNDS));
  }

  if (!keysToCheck || 'affiliation' in keysToCheck) {
    assertString(affiliation, 'affiliation');
    const affiliationsSet = await getAffiliations();
    if (!affiliationsSet.has(affiliation)) {
      throw new BadRequest('Invalid affiliation: ' + affiliation);
    }
    validatedProfile.affiliation = affiliation;
  }

  if (!keysToCheck || 'interests' in keysToCheck) {
    if (!interests) {
      throw new BadRequest('You must specify your interests.');
    }
    const interestsList = interests.map((x) => x.trim());
    const categoriesSet = await getCategories();
    const invalidInterests = interestsList.filter((interest) => !categoriesSet.has(interest));
    if (invalidInterests.length) {
      throw new BadRequest('Invalid interests: ' + JSON.stringify(invalidInterests));
    }
    if (interestsList.length == 0) {
      throw new BadRequest('All interests were invalid');
    }
    validatedProfile.interests = interestsList;
  }

  return validatedProfile;
}


/**
 * Sets the online status of the user corresponding to the username
 * to be true
 * @param {*} username username of user to modify
 * @param {*} status new status to set (true or false)
 */
export async function setOnlineStatus(username, status) {
  await checkThrowAWSError(
      User.update({ onlineStatus: status },
          {
            ConditionExpression: `username = :uname`,
            ExpressionAttributeValues: { ':uname': username },
            ReturnValues: 'ALL_NEW',
          }),
      'ConditionalCheckFailedException',
      new NotFound(`The username ${username} was not found.`),
  );
}

/**
 * Creates a User item in DynamoDB from a create user request.
 * @param {Object} profile the request body of the create user request
 * @return {Object} the new profile object from the database
 */
export async function createUser(profile) {
  profile = await validateUserProfile(profile);
  await checkThrowAWSError(
      User.create(profile, { overwrite: false }),
      'ConditionalCheckFailedException',
      new Conflict(`The specified username '${profile.username}' is taken.`));
  const fullName = profile.firstName + ' ' + profile.lastName;
  const prefixes = [];
  for (let i = 1; i <= fullName.length; i++) {
    prefixes.push(fullName.slice(0, i));
  }
  await UserAutocomplete.create(prefixes.map((prefix) => ({
    prefix: prefix.toLowerCase(),
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
  })));
  // TODO: schedule adsorption algorithm?
  delete profile.passwordHash;
  return profile;
}


/**
 * Given a marshalled AWS profile object, unmarshals it and removes any
 * sensitive information (like password hash).
 * @param {Object} profile a marshalled profile
 * @return {Object} a profile object that is safe to return to the user
 */
function unmarshallProfile(profile) {
  profile = JSON.parse(JSON.stringify(profile));
  return profile;
}


/**
 * Updates a User item in DynamoDB from an update user request.
 * @param {Object} profile the request body of the update user request
 * @return {Object} the new profile object from the database
 */
export async function updateUser(profile) {
  delete profile.firstName;
  delete profile.lastName;
  profile = await validateUserProfile(profile, profile);
  const username = profile.username;
  const newProfile = unmarshallProfile(await checkThrowAWSError(
      User.update(profile,
          {
            ConditionExpression: `username = :uname`,
            ExpressionAttributeValues: { ':uname': username },
            ReturnValues: 'ALL_NEW',
          }),
      'ConditionalCheckFailedException',
      new NotFound(`The username ${username} was not found.`),
  ));
  if (profile.interests) {
    // Run recommender if diff threshold is met
    const interestsDiff = JSON.parse(await redisClient.get('INTERESTS_DIFF') || JSON.stringify({}));
    interestsDiff[username] = true;
    if (Object.keys(interestsDiff).length >= process.env.INTEREST_DIFF_THRESHOLD) {
      recommendArticles();
      await redisClient.set('INTERESTS_DIFF', JSON.stringify({}));
    } else {
      await redisClient.set('INTERESTS_DIFF', JSON.stringify(interestsDiff));
    }
  }
  if (profile.affiliation) {
    const friendships = await queryGetList(
        Friendship.query(newProfile.username).usingIndex('FriendUsernameIndex').loadAll());
    await Promise.all(friendships.map((f) => Friendship.update({
      username: f.username,
      friendUsername: f.friendUsername,
      friendAffiliation: newProfile.affiliation,
      confirmedAffiliationUUID: (
        `${f.confirmed ? 'true' : 'false'}#${newProfile.affiliation}#${f.friendshipUUID}`
      ),
    })));
  }
  delete newProfile.passwordHash;
  return newProfile;
}

/**
 * Gets a User item from DynamoDB.
 * @param {string} username the username of the user to get
 * @return {Object} the profile of the user
 */
export async function getUser(username) {
  const profile = await checkThrowAWSError(
      User.get(username, { ConsistentRead: true }),
      'ResourceNotFoundException',
      new NotFound(`The username ${username} was not found.`),
  );
  return unmarshallProfile(profile);
}

/**
 * Searches for users by a prefix of their full name.
 * @param {string} query a prefix of a user's full name to search for
 * @param {string} page the username to get results after
 * @param {number} limit the max number of results to return
 */
export async function searchUsers(query, page, limit) {
  const results = await queryGetListPageLimit(
      UserAutocomplete.query(query), 'username', page, limit, true);
  for (const result of results) {
    delete result.prefix;
  }
  return results;
}
