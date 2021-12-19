
import { v4 as uuidv4 } from 'uuid';
import dynamo from 'dynamodb';
import { getUser } from '../models/User.js';
import { Conflict, Forbidden, NotFound } from '../error/errors.js';
import Joi from 'joi';
import { unmarshallItem, queryGetListPageLimit, queryGetList, checkThrowAWSError,
  extractUserObject } from '../util/utils.js';

export const Friendship = dynamo.define('Friendship', {
  hashKey: 'username',
  rangeKey: 'friendUsername',
  schema: {
    username: Joi.string(),
    friendUsername: Joi.string(),
    friendFirstName: Joi.string(),
    friendLastName: Joi.string(),
    friendAffiliation: Joi.string(),
    friendshipUUID: Joi.string(),
    confirmedUUID: Joi.string(), // `${confirmed}#${friendshipUUID}`
    confirmedAffiliationUUID: Joi.string(), // `${confirmed}#${friendAffiliation}#${friendshipUUID}`
    confirmed: Joi.boolean().default(false),
    requested: Joi.boolean().default(false),
    timestamp: Joi.string(),
  },
  indexes: [{
    hashKey: 'username', rangeKey: 'friendshipUUID', type: 'local', name: 'FriendUUIDIndex',
  },
  {
    hashKey: 'username', rangeKey: 'confirmedUUID', type: 'local',
    name: 'ConfirmedUUIDIndex',
  },
  {
    hashKey: 'username', rangeKey: 'confirmedAffiliationUUID', type: 'local',
    name: 'ConfirmedAffiliationUUIDIndex',
  },
  {
    hashKey: 'friendUsername', type: 'global', name: 'FriendUsernameIndex',
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
    affiliation: friendship.friendAffiliation,
    confirmed: friendship.confirmed ? true : false,
    requested: friendship.requested ? true : false,
    timestamp: friendship.timestamp,
    friendshipUUID: friendship.friendshipUUID,
    loggedIn: false, // TODO: set loggedIn status
  };
}

/**
 * Converts the given array of friendship models to a visualization response.
 * @param {Object} user the origin user
 * @param {Array} friendships the array of friendship models
 * @return {Object} the visualization response
 */
export function friendshipModelsToVisResponse(user, friendships) {
  return {
    id: user.username,
    name: user.firstName + ' ' + user.lastName,
    children: friendships.map((friendship) => ({
      id: friendship.friendUsername,
      name: friendship.friendFirstName + ' ' + friendship.friendLastName,
      friendshipUUID: friendship.friendshipUUID,
      data: {},
      children: [],
    })),
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
    friendAffiliation: friend.affiliation,
    friendshipUUID,
    confirmedUUID: `false#${friendshipUUID}`,
    confirmedAffiliationUUID: `false#${friend.affiliation}#${friendshipUUID}`,
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
            friendAffiliation: user.affiliation,
            friendshipUUID,
            confirmedUUID: `false#${friendshipUUID}`,
            confirmedAffiliationUUID: `false#${user.affiliation}#${friendshipUUID}`,
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
        const uuid = existingFriendship.friendshipUUID;
        existingFriendship.confirmed = true;
        existingFriendship.confirmedUUID = `true#${uuid}`;
        existingFriendship.confirmedAffiliationUUID = (
          `true#${existingFriendship.friendAffiliation}#${uuid}`
        );
        existingReverseFriendship.confirmed = true;
        existingReverseFriendship.confirmedUUID = `true#${uuid}`;
        existingReverseFriendship.confirmedAffiliationUUID = (
          `true#${existingReverseFriendship.friendAffiliation}#${uuid}`
        );
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
 * @param {string} visualizationOrigin (optional) the username of a user to restrict listed
 *    friends to having the same affiliation as the origin; if specified, this function
 *    will return results in the visualizer format
 * @return {Array} a list of friend usernames
 */
export async function getFriendships(username, page, limit, visualizationOrigin) {
  if (!visualizationOrigin) {
    const friendships = await queryGetListPageLimit(
        Friendship.query(username).usingIndex('FriendUUIDIndex'),
        'friendshipUUID', page, limit, true, // ascending
    );
    return friendships.map(friendshipModelToResponse);
  }
  const originUser = await getUser(visualizationOrigin);
  const originVisualization = (username === visualizationOrigin);
  page = (originVisualization ? 'true#' : `true#${originUser.affiliation}#`) + (page || '');

  const indexName = originVisualization ? 'ConfirmedUUIDIndex' : 'ConfirmedAffiliationUUIDIndex';
  const sortKey = originVisualization ? 'confirmedUUID' : 'confirmedAffiliationUUID';
  const requests = [
    queryGetList(Friendship.query(username).usingIndex(indexName)
        .where(sortKey).gte(page).limit(limit+1)),
  ];
  if (!originVisualization) {
    requests.push(getUser(username));
  }
  const responses = await Promise.all(requests);

  const friendships = responses[0].filter((f) => (
    (!page || f.confirmedAffiliationUUID > page) &&
    f.confirmed && (originVisualization || f.friendAffiliation === originUser.affiliation)
  )).slice(0, limit);
  const user = originVisualization ? originUser : responses[1];
  return friendshipModelsToVisResponse(user, friendships);
}
