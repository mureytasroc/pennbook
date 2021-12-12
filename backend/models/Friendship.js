
import { v4 as uuidv4 } from 'uuid';
import dynamo from 'dynamodb';
import { getUser } from '../models/User';
import { Conflict } from '../error/errors';
import Joi from 'joi';
import { unmarshallAttributes } from '../util/utils.js';


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

/**
 * Creates two Friendship items in DynamoDB from a new friendship creation request to represent
 * a bidirectional friendship
 * @param {Object} username the username of the user to add a friendhsip for
 * @param {Object} friendUsername the username of the new friend
 * @return {Object} the new friendship object
 */
export async function createFriendship(username, friendUsername) {
  const [user, friend] = await Promise.all([getUser(username), getUser(friendUsername)]);
  try {
    function createFriendshipHelper(user, friend) {
      obj = {
        username: user.username,
        friendUsername: friend.username,
        friendFirstName: friend.firstName,
        friendshipUUID: uuidv4(),
        timestamp: new Date().toISOString(),
      }
      return obj
    }
    const friendship = await Friendship.create(createFriendshipHelper(user, friend), { overwrite: false });
    await Friendship.create(createFriendshipHelper(friend, user), { overwrite: false });

    return unmarshallAttributes(friendship.Attributes);
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
 * @param {*} user user to delete friendship from
 * @param {*} friend friend to delete friendship from
 */
export async function deleteFriendship(user, friend) {
  try {
    user = getUser(user)
    friend = getUser(friend)
  } catch (err) {
    throw new NotFound("User or friend not found")
  }

  Friendship.destroy(user.username, friend.username, function (err) {
  })
  Friendship.destroy(friend.username, user.username, function (err) {
    return "Deleted"
  })
}