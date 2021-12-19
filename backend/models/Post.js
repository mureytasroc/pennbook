import dynamo from 'dynamodb';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from './User.js';
import zlib from 'zlib';
import { checkThrowAWSError, queryGetListPageLimit,
  removeDuplicatesByField, extractUserObject, queryGetList,
  executeAsync, unmarshallItem } from '../util/utils.js';
import { Conflict, Forbidden, NotFound } from '../error/errors.js';
import { getAllConfirmedFriendships, getFriendship, getFriendships } from './Friendship.js';

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

export const PostLike = dynamo.define('PostLike', {
  hashKey: 'postUUID',
  rangeKey: 'username',
  schema: {
    postUUID: Joi.string(),
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
  },
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
    likes: post.likes,
    creator: extractUserObject(post, 'creator'),
    receiver: extractUserObject(post),
    content: post.content,
    timestamp: post.timestamp,
  });
}

/**
 * Augments each post in the given array with its like count
 * @param {Array} posts an array of posts to augment with like counts
 */
async function augmentPostsWithLikes(posts) {
  const likes = await Promise.all(posts.map((p) =>
    executeAsync(PostLike.query(p.postUUID).select('COUNT'))));
  return posts.map((p, i) => ({ likes: likes[i].Count, ...p }));
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

export const CommentLike = dynamo.define('CommentLike', {
  hashKey: 'commentUUID',
  rangeKey: 'username',
  schema: {
    commentUUID: Joi.string(),
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
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
    likes: comment.likes,
    creator: extractUserObject(comment, 'creator'),
    content: comment.content,
    timestamp: comment.timestamp,
  });
}

/**
 * Augments each comment in the given array with its like count
 * @param {Array} comments an array of comments to augment with like counts
 */
async function augmentCommentsWithLikes(comments) {
  const likes = await Promise.all(comments.map((c) =>
    executeAsync(CommentLike.query(c.commentUUID).select('COUNT'))));
  return comments.map((c, i) => ({ likes: likes[i].Count, ...c }));
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
  postToCreate.likes = 0;
  return postModelToResponse(postToCreate);
}

/**
 * Checks if the given username has access to the specified post, and returns the post.
 * @param {string} username the username of the user to check access for
 * @param {*} postUUID the UUID of the post to check access on
 * @return {Object} the fetched post
 */
async function checkPostAccess(username, postUUID) {
  const post = await getPost(postUUID);
  if (username !== post.username && username !== post.creatorUsername) {
    try {
      await Promise.any([
        getFriendship(username, post.username),
        getFriendship(username, post.creatorUsername),
      ]);
    } catch (err) {
      if (
        err.errors && err.errors.length == 2 &&
        err.errors[0] instanceof NotFound && err.errors[1] instanceof NotFound
      ) {
        throw new Forbidden(
            `User ${username} is not friends with creator or receiver of post ${postUUID}`);
      }
      throw err;
    }
  }
  return post;
}


/**
 * Adds the specified like relationship to the PostLike table in DynamoDB.
 * @param {string} username the username of the user liking the post
 * @param {string} postUUID the UUID of the post to like
 */
export async function likePost(username, postUUID) {
  const [user, post] = await Promise.all([getUser(username), checkPostAccess(username, postUUID)]); // eslint-disable-line no-unused-vars, max-len
  try {
    await PostLike.create({ postUUID, ...extractUserObject(user) }, { overwrite: false });
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new Conflict(`The username ${username} has already liked the post ${postUUID}.`);
    }
    throw err;
  }
}

/**
 * Removes the specified like relationship from the PostLike table in DynamoDB.
 * @param {string} username the username of the user unliking the post
 * @param {string} postUUID the UUID of the post to unlike
 */
export async function unlikePost(username, postUUID) {
  const existingLike = await PostLike.destroy(
      { postUUID, username },
      { ReturnValues: 'ALL_OLD' },
  );
  if (!existingLike) {
    throw new Conflict(`The username ${username} has not liked the post ${postUUID}.`);
  }
}

/**
 * Get likes on post corresponding to param postUUID
 * @param {string} postUUID the UUID of the post to get likes from
 * @param {string} wallUsername the username of the wall that the post is on
 * @param {string} page the username to get likes less than
 * @param {number} limit the max number of likes to get
 * @return {Array} an array of the likes under the post
 */
export async function getLikesOnPost(postUUID, wallUsername, page, limit) {
  console.log(postUUID, wallUsername, page, limit);
  await getPost(postUUID, wallUsername);
  const likes = await queryGetListPageLimit(
      PostLike.query(postUUID), 'username', page, limit, true);
  return likes.map((l) => extractUserObject(l));
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
  const posts = await augmentPostsWithLikes(removeDuplicatesByField(nestedPosts.flat(), 'postUUID')
      .sort((a, b) => (a.postUUID > b.postUUID ? -1 : 1)) // sort in descending order by postUUID
      .slice(0, limit));
  return posts.map(postModelToResponse);
}

/**
 * Get home page items (wall, friends' walls, friendships)
 * @param {string} username username whose home page to fetch
 * @param {string} page the uuid to get homepage posts less than
 * @param {number} limit the max number of posts to get
 * @return {Array} all posts corresponding to the home page
 */
export async function getHomepageItems(username, page, limit) {
  const [postsOnWall, userFriends] = await Promise.all([
    getPostsOnWall(username, page, limit),
    getAllConfirmedFriendships(username, true, true),
  ]);

  const [postsOnFriends, friendsOfFriends] = await Promise.all([
    Promise.all(
        userFriends.map(({ username }) => getPostsOnWall(username, page, limit))),
    Promise.all(
        userFriends.map(({ username }) => getFriendships(
            username, page ? `true#${page}` : undefined, limit, undefined, true, true))),
  ]);

  const allPosts = await augmentPostsWithLikes(postsOnWall.concat(postsOnFriends.flat())
      .map((post) => ({ ...post, uuid: post.postUUID })));

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
 * @param {string} wallUsername (optional) the asserted creator or receiver of the post
 */
async function getPost(postUUID, wallUsername) {
  const posts = await queryGetList(Post.query(postUUID).usingIndex('PostUUIDIndex').loadAll());
  if (!posts.length) {
    throw new NotFound(`The post ${postUUID} was not found.`);
  }
  const post = posts[0];
  if (wallUsername && wallUsername !== post.username && wallUsername !== post.creatorUsername) {
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
  commentToCreate.likes = 0;
  return commentModelToResponse(commentToCreate);
}

/**
 * Gets the specified comment, or returns 404 if not found.
 * @param {string} postUUID the UUID of the comment's post
 * @param {string} commentUUID the UUID of the comment
 */
async function getComment(postUUID, commentUUID) {
  return unmarshallItem(await checkThrowAWSError(
      Comment.get(postUUID, commentUUID),
      'ResourceNotFoundException',
      new NotFound(`A comment with UUID ${commentUUID} under post ${postUUID} was not found.`)));
}

/**
 * Adds the specified like relationship to the CommentLike table in DynamoDB.
 * @param {string} username the username of the user liking the comment
 * @param {string} postUUID the UUID of the comment's post
 * @param {string} commentUUID the UUID of the comment to like
 */
export async function likeComment(username, postUUID, commentUUID) {
  const [user, post, comment] = await Promise.all([ // eslint-disable-line no-unused-vars
    getUser(username),
    checkPostAccess(username, postUUID),
    getComment(postUUID, commentUUID),
  ]);
  try {
    await CommentLike.create({ commentUUID, ...extractUserObject(user) }, { overwrite: false });
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new Conflict(`The username ${username} has already liked the comment ${commentUUID}.`);
    }
    throw err;
  }
}

/**
 * Removes the specified like relationship from the CommentLike table in DynamoDB.
 * @param {string} username the username of the user unliking the comment
 * @param {string} postUUID the UUID of the comment's post
 * @param {string} commentUUID the UUID of the comment to unlike
 */
export async function unlikeComment(username, postUUID, commentUUID) {
  const existingLike = await CommentLike.destroy(
      { commentUUID, username },
      { ReturnValues: 'ALL_OLD' },
  );
  if (!existingLike) {
    throw new Conflict(`The username ${username} has not liked the comment ${commentUUID}.`);
  }
}

/**
 * Gets a page of likes for the specified comment.
 * @param {string} postUUID the UUID of the comment's post
 * @param {string} wallUsername the username of the wall that the post is on
 * @param {string} commentUUID the UUID of the comment to get likes from
 * @param {string} page the username to get likes less than
 * @param {number} limit the max number of likes to get
 * @return {Array} an array of the likes under the post
 */
export async function getLikesOnComment(postUUID, wallUsername, commentUUID, page, limit) {
  await Promise.all([getPost(postUUID, wallUsername), getComment(postUUID, commentUUID)]);
  const likes = await queryGetListPageLimit(
      CommentLike.query(commentUUID), 'username', page, limit, true);
  return likes.map((l) => extractUserObject(l));
}

/**
 * Get comments on post corresponding to param postUUID
 * @param {string} postUUID the UUID of the post to comment on
 * @param {string} wallUsername the username of the wall that the post is on
 * @param {string} page the commentUUID to get comments less than
 * @param {number} limit the max number of comments to get
 * @return {Array} an array of the comments under the post
 */
export async function getCommentsOnPost(postUUID, wallUsername, page, limit) {
  await getPost(postUUID, wallUsername);
  const comments = await augmentCommentsWithLikes(
      await queryGetListPageLimit(Comment.query(postUUID), 'commentUUID', page, limit));
  return comments.map(commentModelToResponse);
}
