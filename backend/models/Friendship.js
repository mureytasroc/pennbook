
import { v4 as uuidv4 } from 'uuid';
import dynamo from 'dynamodb';
import { getUser } from '../models/User';
import { NotFound, Conflict } from '../error/errors';
import Joi from 'joi';


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
 * @param {Object} user the user to create a friendship from
 * @param {Object} friend the friend to create a friendship with
 * @return {Object} the new friendship object
 */
export async function createFriendship(user, friend) {
  try {
    user = getUser(user);
    friend = getUser(friend);
  } catch (err) {
    throw new NotFound('User or friend not found');
  }
  const friendship = {};
  friendship.username = user;
  friendship.friendUsername = friend.username;
  friendship.friendFirstName = friend.firstName;
  friendship.friendshipUUID = uuidv4();
  friendship.timestamp = new Date().toISOString();
  try {
    const fship = await Friendship.create(friendship, { overwrite: false });
    return fship;
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new Conflict(
          `The specified friendship between '${friendship.username}'` +
          `and '${friendship.friendUsername}' is taken.`,
      );
    }
    throw err;
  }
}
