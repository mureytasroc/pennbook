import dynamo from 'dynamodb';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from './User.js';
import zlib from 'zlib';
import _ from 'lodash';
import { executeAsync, unmarshallAttributes } from '../util/utils.js';
import { BadRequest } from '../error/errors.js';
import { getFriendships } from './Friendship.js';

export const Post = dynamo.define('Post', {
  hashKey: 'username',
  rangeKey: 'postUUID',
  schema: {
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    postUUID: Joi.string(),
    creatorUsername: Joi.string(),
    creatorFirstName: Joi.string(),
    creatorLastName: Joi.string(),
    type: Joi.string(),
    content: Joi.binary(),
  },
  indexes: [{
    hashKey: 'creatorUsername', rangeKey: 'postUUID', type: 'global', name: 'CreatorPostsIndex',
  }],
});

export const Comment = dynamo.define('Comment', {
  hashKey: 'postUUID',
  rangeKey: 'commentUUID',
  schema: {
    postUUID: Joi.string(),
    commentUUID: Joi.string(),
    timestamp: Joi.date(),
    creatorUsername: Joi.string(),
    creatorFirstName: Joi.string(),
    creatorLastName: Joi.string(),
    content: Joi.binary(),
  },
});


/**
 * Creates a Post item in DynamoDB from a create post request.
 * @param {Object} postObj the request body of the create post request
 * @param {Object} creatorUname the creator's username
 * @param {Object} receiveUname the receiver's username
 * @return {Object} the new post object from the database
 */
export async function createPost(postObj, creatorUname, receiveUname) {
  const post = {};
  const [receiver, creator] = await Promise.all([getUser(receiveUname), getUser(creatorUname)]);
  post.postUUID = new Date().toISOString() + '#' + uuidv4();
  post.username = receiver.username;
  post.firstName = receiver.firstName;
  post.lastName = receiver.lastName;
  post.creatorUsername = creator.username;
  post.creatorFirstName = creator.firstName;
  post.creatorLastName = creator.lastName;
  post.type = postObj.type;
  post.content = zlib.gzipSync(postObj.content);


  if (post.type !== 'Status Update' && post.type !== 'Post') {
    throw new BadRequest('Post type must be one of Post, Status Update');
  }

  try {
    const createdPost = await Post.create(post, { overwrite: false });
    return createdPost;
  } catch (err) {
    throw err;
  }
}

/**
 * Get posts from wall corresponding to param wallUsername
 * @param {*} wallUsername Username of person whose wall to post on
 * @return {*} posts from that wall
 */
export async function getPostsOnWall(wallUsername) {
  try {
    const uncompressData = function(obj) {
      obj.content = zlib.gunzipSync(Buffer.from(obj.content.data)).toString();
      return obj;
    };

    const callback = function(resp) {
      const mapped = _.map(resp.Items, (x) => unmarshallAttributes(x));
      return _.map(mapped, (x) => uncompressData(x));
    };
    const posts = await executeAsync(Post.query(wallUsername), callback);
    return posts;
  } catch (err) {
    throw err;
  }
}

/**
 * Get home page posts (wall, friends' walls, friendships)
 * @param {*} username username whose home page to fetch
 * @return {*} all posts corresponding to the home page
 */
export async function getPostsOnHomePage(username) {
  try {
    const self = await getUser(username);
    const postsOnWall = await getPostsOnWall(username);
    const postsOnFriends = [];
    let friendships = await getFriendships(username);
    friendships = _.map(friendships, (item) => {
      return { ...item, type: 'friendship', postUUID: item.friendshipUUID };
    },
    );
    for (const item of friendships) {
      postsOnFriends.push(...(await getPostsOnWall(item.friendUsername)));
    }

    // Display results in order of most recent to oldest
    const allPosts = [...postsOnWall, ...postsOnFriends, ...friendships];
    allPosts.sort((a, b) => a.postUUID < b.postUUID ? 1 : a.postUUID > b.postUUID ? -1 : 0);

    /**
     * Format data to make it easier for the frontend to extract attributes
     * @param {*} item
     * @return {Object} formatted object
     */
    function formatData(item) {
      if (item.type == 'friendship') {
        delete item.postUUID;
        item.firstName = self.firstName;
        item.lastName = self.lastName;
      }
      return item;
    }

    return _.map(allPosts, formatData);
  } catch (err) {
    throw err;
  }
}

/**
 * Creates a Comment item in DynamoDB from a create comment request.
 * @param {Object} body the request body of the create comment request
 * @param {Object} postUUID the UUID of the post to comment on
 * @param {Object} creatorUname the comment creator's username
 * @return {Object} the new comment object from the database
 */
export async function createComment(body, postUUID, creatorUname) {
  const creator = await getUser(creatorUname);
  const postUUIDparsed = decodeURIComponent(postUUID);
  const creationTime = new Date().toISOString();
  const comment = {
    postUUID: postUUIDparsed,
    creatorUsername: creator.username,
    creatorFirstName: creator.firstName,
    creatorLastName: creator.lastName,
    timestamp: creationTime,
    commentUUID: creationTime + '#' + uuidv4(),
    content: zlib.gzipSync(body.content),
  };

  try {
    const createdComment = await Comment.create(comment, { overwrite: false });
    return createdComment;
  } catch (err) {
    throw err;
  }
}

/**
 * Get comments on post corresponding to param postUUID
 * @param {*} postUUID
 * @return {*}
 */
export async function getCommentsOnPost(postUUID) {
  try {
    const uncompressData = function(obj) {
      obj.content = zlib.gunzipSync(Buffer.from(obj.content.data)).toString();
      return obj;
    };

    const callback = function(resp) {
      const mapped = _.map(resp.Items, (x) => unmarshallAttributes(x));
      return _.map(mapped, (x) => uncompressData(x));
    };
    const comments = await executeAsync(Comment.query(postUUID), callback);
    return comments;
  } catch (err) {
    throw err;
  }
}
