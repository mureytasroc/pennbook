
import { v4 as uuidv4 } from 'uuid';
import dynamo from 'dynamodb';
import { getUser } from '../models/User.js';
import { Conflict, Forbidden, NotFound } from '../error/errors.js';
import Joi from 'joi';
import { unmarshallItem, queryGetListPageLimit, checkThrowAWSError,
  extractUserObject } from '../util/utils.js';

export const Friendship = dynamo.define('Friendship', {
  hashKey: 'username',
  rangeKey: 'friendUsername',
  schema: {
    username: Joi.string(),
    friendUsername: Joi.string(),
    friendFirstName: Joi.string(),
    friendLastName: Joi.string(),
    friendshipUUID: Joi.string(),
    confirmed: Joi.boolean().default(false),
    requested: Joi.boolean().default(false),
    timestamp: Joi.string(),
  },
  indexes: [{
    hashKey: 'username', rangeKey: 'friendshipUUID', type: 'local', name: 'FriendUUIDIndex',
  }],
});

/**
 * Converts the given dynamoDB friendship object to a response object.
 * @param {Object} friendship the dynamoDB friendship object
 * @return {Object} the converted response object
 */
export function friendshipModelToResponse(friendship) {
  return {
    ...extractUserObject(friendship, 'friend'),
    confirmed: friendship.confirmed ? true : false,
    timestamp: friendship.timestamp,
    friendshipUUID: friendship.friendshipUUID,
    loggedIn: false, // TODO: set loggedIn status
  };
}

/**
 * Creates two Friendship items in DynamoDB from a new friendship creation request to represent
 * a bidirectional friendship
 * @param {Object} username the username of the user to add a friendhsip for
 * @param {Object} friendUsername the username of the new friend
 * @return {Object} the new friendship object
 */
export async function createFriendship(username, friendUsername) {
  const [user, friend] = await Promise.all([getUser(username), getUser(friendUsername)]);

  const timestamp = new Date().toISOString();
  const friendshipUUID = timestamp + uuidv4();

  const friendship = {
    username,
    friendUsername: friend.username,
    friendFirstName: friend.firstName,
    friendLastName: friend.lastName,
    friendshipUUID,
    timestamp,
    requested: true,
  };
  try {
    await checkThrowAWSError(
        Promise.all([
          Friendship.create(friendship, { overwrite: false, ReturnValues: 'ALL_OLD' }),
          Friendship.create({
            username: friend.username,
            friendUsername: user.username,
            friendFirstName: user.firstName,
            friendLastName: user.lastName,
            friendshipUUID,
            timestamp,
          },
          { overwrite: false, ReturnValues: 'ALL_OLD' }),
        ]),
        'ConditionalCheckFailedException',
        new Conflict(
            `A friendship between '${username}' and '${friendUsername}' already exists.`),
    );
  } catch (err) {
    if (err instanceof Conflict) {
      const [existingFriendship, existingReverseFriendship] = await Promise.all([
        getFriendship(username, friendUsername),
        getFriendship(friendUsername, username),
      ]);
      if (!existingFriendship.requested && !existingFriendship.confirmed) {
        // confirm friendship
        existingFriendship.confirmed = true;
        existingReverseFriendship.confirmed = true;
        await Promise.all([
          Friendship.update(existingFriendship),
          Friendship.update(existingReverseFriendship),
        ]);
        return friendshipModelToResponse(existingFriendship);
      }
    }
    throw err;
  }
  return friendshipModelToResponse(friendship);
}

/**
 * Given a username and a friendUsername, get the friendship between them
 * @param {string} username
 * @param {string} friendUsername
 * @return {Object} the friendship object
 */
export async function getFriendship(username, friendUsername) {
  const res = await checkThrowAWSError(
      Friendship.get(username, friendUsername, { ConsistentRead: true }),
      'ResourceNotFoundException',
      new NotFound(
          `The specified friendship between '${username}' and '${friendUsername}' was not found`),
  );
  return unmarshallItem(res);
}

/**
 * Given a username and a friendUsername, assert that a friendship exists between them
 * and the friendship is confirmed (or throw an error).
 * @param {string} username
 * @param {string} friendUsername
 */
export async function assertFriendshipConfirmed(username, friendUsername) {
  let notFriends = false;
  let friendship = null;
  try {
    friendship = await getFriendship(username, friendUsername);
  } catch (err) {
    if (!(err instanceof NotFound)) {
      throw err;
    }
    notFriends = true;
  }
  if (!friendship || !friendship.confirmed) {
    notFriends = true;
  }
  if (notFriends) {
    throw new Forbidden(`Users ${username} and ${friendUsername} are not friends.`);
  }
}

/**
 * Deletes a pair of Friendships from DynamoDB given two users
 * @param {string} username username of user to delete friendship from
 * @param {string} friendUsername username of friend to delete friendship from
 */
export async function deleteFriendship(username, friendUsername) {
  const [existingFriendship, existingReverseFriendship] = await Promise.all([
    Friendship.destroy(username, friendUsername, { ReturnValues: 'ALL_OLD' }),
    Friendship.destroy(friendUsername, username, { ReturnValues: 'ALL_OLD' }),
  ]);
  if (!existingFriendship && !existingReverseFriendship) {
    throw new NotFound(
        `The specified friendship between '${username}' and '${friendUsername}' was not found`);
  }
}

/**
 * Given a username, get an array of all its friends
 * @param {string} username the username to get friends of
 * @param {string} page the friendshipUUID to get friendships before
 * @param {number} limit the max number of friendships to get
 * @return {Array} a list of friend usernames
 */
export async function getFriendships(username, page, limit) {
  const friendships = await queryGetListPageLimit(
      Friendship.query(username).usingIndex('FriendUUIDIndex'), 'friendshipUUID', page, limit);
  return friendships.map(friendshipModelToResponse);
}
