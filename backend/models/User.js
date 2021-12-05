
import bcrypt from 'bcrypt';
import dynamo from 'dynamodb';
import emailValidator from 'email-validator';
import Joi from 'joi';
import memoize from 'memoizee';
import { getCategories } from 'News';
import owasp from 'owasp-password-strength-test';
import { BadRequest, Conflict, NotFound } from '../error/errors';
import { assertString, unmarshallAttributes } from '../util/utils';


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

export const Friendship = dynamo.define('Friendship', {
  hashKey: 'username',
  rangeKey: 'friendshipUUID',
  schema: {
    username: Joi.string(),
    friendUsername: Joi.string(),
    friendFirstName: Joi.string(),
    friendLastName: Joi.string(),
    friendshipUUID: Joi.string(),
    confirmed: Joi.boolean().default(false),
    timestamp: Joi.date(),
  },
  indexes: [{
    hashKey: 'username', rangeKey: 'friendUsername', type: 'local', name: 'FriendUsernameIndex',
  }],
});

dynamo.createTables(function(err) {
  if (err && err.code !== 'ResourceInUseException') {
    throw err;
  }
});

/**
 * @return {Set} a set of valid affiliations
 */
const getAffiliationsUnmemoized = async function() {
  const affiliations = await Affiliation.loadAll().exec();
  const affiliationsSet = new Set();
  affiliations.map((item) => item.affiliation).forEach(affiliationsSet.add);
  return affiliationsSet;
};

export const getAffiliations = memoize(getAffiliationsUnmemoized, { maxAge: 1000 * 60 * 60 });

const isValidUsername = /^[a-zA-Z0-9-_]+$/;

/**
 * Validates a user profile provided by a create or update user request.
 * @param {Object} profile the request body of a create or update user request
 * @param {Object} keysToCheck (optional) the keys to validate
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
    validatedProfile.password = await bcrypt.hash(password, process.env.passwordSaltRounds);
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
    const categoriesSet = await getCategories();
    const invalidInterests = interests.filter((interest) => !categoriesSet.has(interest));
    if (invalidInterests.length) {
      throw new BadRequest('Invalid interests: ' + JSON.stringify(invalidInterests));
    }
    validatedProfile.interests = interests;
  }

  return validatedProfile;
}

/**
 * Creates a User item in DynamoDB from a create user request.
 * @param {Object} profile the request body of the create user request
 * @return {Object} the new profile object from the database
 */
export async function createUser(profile) {
  profile = validateUserProfile(profile);
  try {
    await User.create(profile, { overwrite: false });
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new Conflict(`The specified username '${profile.username}' is taken.`);
    }
    throw err;
  }
  return profile;
}

/**
 * Updates a User item in DynamoDB from an update user request.
 * @param {Object} profile the request body of the update user request
 * @return {Object} the new profile object from the database
 */
export async function updateUser(profile) {
  profile = validateUserProfile(profile, profile);
  const username = profile.username;
  try {
    const newProfile = await User.update(
        profile,
        {
          ConditionExpression: `username = :uname`,
          ExpressionAttributeValues: { ':uname': username },
          ReturnValues: 'ALL_NEW',
        },
    );
    return unmarshallAttributes(newProfile.Attributes);
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new NotFound(`The username ${username} was not found.`);
    }
    throw err;
  }
}

/**
 * Gets a User item from DynamoDB.
 * @param {string} username the username of the user to get
 * @return {Object} the profile of the user
 */
export async function getUser(username) {
  try {
    const profile = await User.get( username, { ConsistentRead: true });
    return unmarshallAttributes(profile.Attributes);
  } catch (err) {
    if (err.code === 'ResourceNotFoundException') {
      throw new NotFound(`The username ${username} was not found.`);
    }
    throw err;
  }
}
