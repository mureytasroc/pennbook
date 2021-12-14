
import { v4 as uuidv4 } from 'uuid';
import dynamo from 'dynamodb';
import { getUser } from '../models/User.js';
import { Conflict, NotFound } from '../error/errors.js';
import Joi from 'joi';
import _ from 'lodash';
import { unmarshallAttributes, executeAsync } from '../util/utils.js';

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
    timestamp: Joi.date(),
  },
  indexes: [{
    hashKey: 'username', rangeKey: 'friendshipUUID', type: 'local', name: 'FriendUUIDIndex',
  }],
});

/**
 * Creates two Friendship items in DynamoDB from a new friendship creation request to represent
 * a bidirectional friendship
 * @param {Object} username the username of the user to add a friendhsip for
 * @param {Object} friendUsername the username of the new friend
 * @return {Object} the new friendship object
 */
export async function createFriendship(username, friendUsername) {
  const [user, friend] = await Promise.all([getUser(username), getUser(friendUsername)]);

  if (_.isEmpty(user) || _.isEmpty(friend)) {
    throw new NotFound('At least one user does not exist');
  }

  try {
    /**
     * Create friendship object using user and friend
     * @param {*} user
     * @param {*} friend
     * @return {*}
     */
    function createFriendshipHelper(user, friend) {
      const obj = {
        username: user.username,
        friendUsername: friend.username,
        friendFirstName: friend.firstName,
        friendLastName: friend.lastName,
        friendshipUUID: new Date().toISOString() + '#' + uuidv4(),
        timestamp: new Date().toISOString(),
      };
      return obj;
    }

    const friendship = await Friendship.create(createFriendshipHelper(user, friend),
      { overwrite: false });
    await Friendship.create(createFriendshipHelper(friend, user),
      { overwrite: false });

    return unmarshallAttributes(friendship);
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new Conflict(
        `The specified friendship between '${username}' and '${friendUsername}' already exists.`,
      );
    }
    throw err;
  }
}

/**
 * Given a username and a friendUsername, get the friendship between them
 * @param {*} username
 * @param {*} friendUsername
 * @return {*}
 */
export async function getFriendship(username, friendUsername) {
  try {
    const friendship = await Friendship.get(username, friendUsername, { ConsistentRead: true })
    if (!friendship) {
      throw new NotFound(`The specified friendship between '${username}' and ` +
        `'${friendUsername}' was not found`);
    }
    return unmarshallAttributes(friendship);
  } catch (err) {
    if (err.code === 'ResourceNotFoundException') {
      throw new NotFound(`The specified friendship between '${username}' ` +
        `and '${friendUsername}' was not found`);
    }
    throw err;
  }
}

/**
 * Deletes a pair of Friendships from DynamoDB given two users
 * @param {*} username username of user to delete friendship from
 * @param {*} friendUsername username of friend to delete friendship from
 */
export async function deleteFriendship(username, friendUsername) {
  const [user, friend] = await Promise.all([getUser(username), getUser(friendUsername)]);

  if (_.isEmpty(user) || _.isEmpty(friend)) {
    throw new NotFound('At least one user does not exist');
  }

  Friendship.destroy(user.username, friend.username, function (err) {
    if (err) {
      throw err;
    }
  });
  Friendship.destroy(friend.username, user.username, function (err) {
    if (err) {
      throw err;
    }
  });
}

/**
 * Given a username, get all friendships  corresponding to it
 * @param {*} username
 * @param {*} friendUsername
 * @return {Object} a list of friend usernames
 */
export async function getFriendships(username) {
  try {
    const callback = function (resp) {
      return _.map(resp.Items, (x) => unmarshallAttributes(x));
    };
    const friendships = await executeAsync(Friendship.query(username), callback);
    return friendships;
  } catch (err) {
    throw err;
  }
}
