
import { v4 as uuidv4 } from 'uuid';
import dynamo from 'dynamodb';
import { getUser } from '../models/User.js';
import { Conflict, NotFound } from '../error/errors.js';
import Joi from 'joi';
import _ from 'lodash';

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
        friendshipUUID: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      return obj;
    }

    const friendship = await Friendship.create(createFriendshipHelper(user, friend),
        { overwrite: false });
    await Friendship.create(createFriendshipHelper(friend, user),
        { overwrite: false });

    return JSON.parse(JSON.stringify(friendship));
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
 * Deletes a pair of Friendships from DynamoDB given two users
 * @param {*} username username of user to delete friendship from
 * @param {*} friendUsername username of friend to delete friendship from
 */
export async function deleteFriendship(username, friendUsername) {
  const [user, friend] = await Promise.all([getUser(username), getUser(friendUsername)]);

  if (_.isEmpty(user) || _.isEmpty(friend)) {
    throw new NotFound('At least one user does not exist');
  }

  Friendship.destroy(user.username, friend.username, function(err) {
    if (err) {
      throw err;
    }
  });
  Friendship.destroy(friend.username, user.username, function(err) {
    if (err) {
      throw err;
    }
  });
}
