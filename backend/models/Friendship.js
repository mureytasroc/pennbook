
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
 * Creates a Friendship item in DynamoDB from a new friendship creation request.
 * @param {Object} username the username of the user to add a friendhsip for
 * @param {Object} friendUsername the username of the new friend
 * @return {Object} the new friendship object
 */
export async function createFriendship(username, friendUsername) {
  const [user, friend] = await Promise.all([getUser(username), getUser(friendUsername)]);
  try {
    const friendship = await Friendship.create({
      username: user.username,
      friendUsername: friend.username,
      friendFirstName: friend.firstName,
      friendshipUUID: uuidv4(),
      timestamp: new Date().toISOString(),
    }, { overwrite: false });
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
