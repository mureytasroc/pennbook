import dynamo from 'dynamodb';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from './User.js';
import zlib from 'zlib';
import { checkThrowAWSError, queryGetListPageLimit,
  removeDuplicatesByField, extractUserObject, queryGetList } from '../util/utils.js';
import { Conflict, NotFound } from '../error/errors.js';
import { getFriendships } from './Friendship.js';

/**
 * Uncompresses the content attribute of the given object.
 * @param {Object} obj the object whose content attribute to uncompress
 * @return {Object} obj with its content attribute uncompressed
 */
function uncompressData(obj) {
  obj.content = zlib.gunzipSync(Buffer.from(obj.content)).toString();
  return obj;
};

export const Post = dynamo.define('Post', {
  hashKey: 'username',
  rangeKey: 'postUUID',
  schema: {
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    postUUID: Joi.string(),
    timestamp: Joi.string(),
    creatorUsername: Joi.string(),
    creatorFirstName: Joi.string(),
    creatorLastName: Joi.string(),
    type: Joi.string(),
    content: Joi.binary(),
  },
  indexes: [{
    hashKey: 'creatorUsername', rangeKey: 'postUUID', type: 'global', name: 'CreatorPostsIndex',
  }, {
    hashKey: 'postUUID', type: 'global', name: 'PostUUIDIndex',
  }],
});

/**
 * Converts the given dynamoDB post object to a response object.
 * @param {Object} post the dynamoDB post object
 * @return {Object} the converted response object
 */
function postModelToResponse(post) {
  return uncompressData({
    type: post.type,
    postUUID: post.postUUID,
    creator: extractUserObject(post, 'creator'),
    receiver: extractUserObject(post),
    content: post.content,
    timestamp: post.timestamp,
  });
}

export const Comment = dynamo.define('Comment', {
  hashKey: 'postUUID',
  rangeKey: 'commentUUID',
  schema: {
    postUUID: Joi.string(),
    wallUsername: Joi.string(),
    commentUUID: Joi.string(),
    timestamp: Joi.string(),
    creatorUsername: Joi.string(),
    creatorFirstName: Joi.string(),
    creatorLastName: Joi.string(),
    content: Joi.binary(),
  },
});

/**
 * Converts the given dynamoDB comment object to a response object.
 * @param {Object} comment the dynamoDB comment object
 * @return {Object} the converted response object
 */
function commentModelToResponse(comment) {
  return uncompressData({
    commentUUID: comment.commentUUID,
    creator: extractUserObject(comment, 'creator'),
    content: comment.content,
    timestamp: comment.timestamp,
  });
}

/**
 * Creates a Post item in DynamoDB from a create post request.
 * @param {Object} postObj the request body of the create post request
 * @param {Object} creatorUname the creator's username
 * @param {Object} receiveUname the receiver's username
 * @return {Object} the new post object from the database
 */
export async function createPost(postObj, creatorUname, receiveUname) {
  const [creator, receiver] = await Promise.all([getUser(creatorUname), getUser(receiveUname)]);
  const timestamp = new Date().toISOString();
  const postUUID = timestamp + uuidv4();
  const postToCreate = {
    postUUID,
    timestamp,
    username: receiver.username,
    firstName: receiver.firstName,
    lastName: receiver.lastName,
    creatorUsername: creator.username,
    creatorFirstName: creator.firstName,
    creatorLastName: creator.lastName,
    type: postObj.type,
    content: zlib.gzipSync(postObj.content),
  };
  await checkThrowAWSError(
      Post.create(postToCreate, { overwrite: false }),
      'ConditionalCheckFailedException',
      new Conflict(`The specified post (postUUID ${postUUID}) already exists.`),
  );
  return postModelToResponse(postToCreate);
}

/**
 * Get posts from wall corresponding to param wallUsername
 * @param {string} wallUsername username of person whose wall to get posts from
 * @param {string} page the postUUID to get posts before
 * @param {number} limit the max number of posts to get
 * @return {Array} array of post objects from that wall
 */
export async function getPostsOnWall(wallUsername, page, limit) {
  const nestedPosts = await Promise.all([
    queryGetListPageLimit(Post.query(wallUsername), 'postUUID', page, limit),
    queryGetListPageLimit(
        Post.query(wallUsername).usingIndex('CreatorPostsIndex'), 'postUUID', page, limit),
  ]);
  return removeDuplicatesByField(nestedPosts.flat(), 'postUUID')
      .map(postModelToResponse)
      .sort((a, b) => (a.postUUID > b.postUUID ? -1 : 1)) // sort in descending order by postUUID
      .slice(0, limit);
}

/**
 * Get home page items (wall, friends' walls, friendships)
 * @param {string} username username whose home page to fetch
 * @param {string} page the uuid to get homepage posts less than
 * @param {number} limit the max number of posts to get
 * @return {Array} all posts corresponding to the home page
 */
export async function getHomepageItems(username, page, limit) {
  let [postsOnWall, userFriends] = await Promise.all([
    getPostsOnWall(username, page, limit),
    getFriendships(username),
  ]);
  userFriends = userFriends.filter((friendship) => friendship.confirmed);

  const [postsOnFriends, friendsOfFriends] = await Promise.all([
    Promise.all(
        userFriends.map(({ username }) => getPostsOnWall(username, page, limit))),
    Promise.all(
        userFriends.map(({ username }) => getFriendships(username, page, limit))),
  ]);

  const allPosts = postsOnWall.concat(postsOnFriends.flat()).map((post) => ({
    ...post, uuid: post.postUUID,
  }));

  const friendships2D = friendsOfFriends.flatMap((friendsOfFriend, i) => friendsOfFriend.filter(
      (friendship) => friendship.confirmed && friendship.username !== username,
  ).map(
      (friendship) => ({
        type: 'Friendship',
        uuid: friendship.friendshipUUID,
        friendshipUUID: friendship.friendshipUUID,
        timestamp: friendship.timestamp,
        friend: extractUserObject(userFriends[i]),
        friendOfFriend: extractUserObject(friendship),
      }),
  ));

  const allHomepageItems = allPosts.concat(friendships2D);
  return removeDuplicatesByField(allHomepageItems, 'uuid')
      .sort((a, b) => (a.uuid > b.uuid ? -1 : 1)) // sort in descending order by uuid
      .slice(0, limit);
}

/**
 * Gets the specified post, or returns 404 if not found.
 * @param {string} postUUID the UUID of the post to get
 * @param {string} wallUsername the asserted creator or receiver of the post
 */
async function getPost(postUUID, wallUsername) {
  const posts = await queryGetList(Post.query(postUUID).usingIndex('PostUUIDIndex').loadAll());
  if (!posts.length) {
    throw new NotFound(`The post ${postUUID} was not found.`);
  }
  const post = posts[0];
  if (wallUsername !== post.username && wallUsername !== post.creatorUsername) {
    throw new NotFound(`The post ${postUUID} under username ${wallUsername} was not found.`);
  }
  return post;
}

/**
 * Creates a Comment item in DynamoDB from a create comment request.
 * @param {Object} body the request body of the create comment request
 * @param {Object} postUUID the UUID of the post to comment on
 * @param {string} wallUsername the username of the wall that the post is on
 * @param {string} creatorUname the comment creator's username
 * @return {Object} the new comment object from the database
 */
export async function createComment(body, postUUID, wallUsername, creatorUname) {
  const [creator, post] = await Promise.all([ // eslint-disable-line no-unused-vars
    getUser(creatorUname),
    getPost(postUUID, wallUsername),
  ]);
  const timestamp = new Date().toISOString();
  const commentUUID = timestamp + uuidv4();
  const commentToCreate = {
    postUUID,
    wallUsername,
    creatorUsername: creator.username,
    creatorFirstName: creator.firstName,
    creatorLastName: creator.lastName,
    timestamp,
    commentUUID,
    content: zlib.gzipSync(body.content),
  };
  await checkThrowAWSError(
      Comment.create(commentToCreate, { overwrite: true }),
      'ConditionalCheckFailedException',
      new Conflict(`The specified comment (commentUUID ${commentUUID}) already exists.`),
  );
  return commentModelToResponse(commentToCreate);
}

/**
 * Get comments on post corresponding to param postUUID
 * @param {string} postUUID the UUID of the post to comment on
 * @param {string} wallUsername the username of the wall that the post is on
 * @param {string} page the commentUUID to get recommendations less than
 * @param {number} limit the max number of comments to get
 * @return {Array} an array of the comments under the post
 */
export async function getCommentsOnPost(postUUID, wallUsername, page, limit) {
  await getPost(postUUID, wallUsername);
  const comments = await queryGetListPageLimit(Comment.query(postUUID), 'commentUUID', page, limit);
  return comments.map(commentModelToResponse);
}
