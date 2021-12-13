import dynamo from 'dynamodb';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid'
import { getUser } from './User.js';
import zlib from 'zlib'
import _ from 'lodash'
import { executeAsync, unmarshallAttributes } from '../util/utils.js';
import { BadRequest } from '../error/errors.js';
import { getFriendship, getFriendships } from './Friendship.js';

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
 * @param {Object} post the request body of the create post request
 * @return {Object} the new post object from the database
 */
export async function createPost(postObj, creatorUname, receiveUname) {
  const post = {}
  const [receiver, creator] = await Promise.all([getUser(receiveUname), getUser(creatorUname)]);
  post.postUUID = new Date().toISOString() + "#" + uuidv4()
  post.username = receiver.username
  post.firstName = receiver.firstName
  post.lastName = receiver.lastName
  post.creatorUsername = creator.username
  post.creatorFirstName = creator.firstName
  post.creatorLastName = creator.lastName
  post.type = postObj.type
  post.content = zlib.gzipSync(postObj.content)


  if (post.type !== "Status Update" && post.type !== "Post") {
    throw new BadRequest("Post type must be one of Post, Status Update")
  }

  try {
    var created_post = await Post.create(post, { overwrite: false });
  } catch (err) {
    throw err;
  }
  return created_post
}

/**
 * Get posts from wall corresponding to param wallUsername
 * @param {*} wallUsername 
 * @returns {*}
 */
export async function getPostsOnWall(wallUsername) {

  try {
    function uncompressData(obj) {
      obj.content = zlib.gunzipSync(Buffer.from(obj.content.data)).toString()
      return obj
    }

    const callback = function (resp) {
      var mapped = _.map(resp.Items, (x) => unmarshallAttributes(x));
      return _.map(mapped, (x) => uncompressData(x))
    };
    var posts = await executeAsync(Post.query(wallUsername), callback)
    return posts
  } catch (err) {
    throw err;
  }
}

/**
 * Get home page posts (wall, friends' walls, friendships)
 * @param {*} wallUsername 
 * @returns {*}
 */
export async function getPostsOnHomePage(username) {

  try {
    var self = await getUser(username)
    var postsOnWall = await getPostsOnWall(username)
    var postsOnFriends = []
    var friendships = await getFriendships(username)
    friendships = _.map(friendships, item => {
      return { ...item, type: 'friendship', postUUID: item.friendshipUUID }
    }
    )
    for (let item of friendships) {
      postsOnFriends.push(...(await getPostsOnWall(item.friendUsername)))
    }

    // Display results in order of most recent to oldest
    var allPosts = [...postsOnWall, ...postsOnFriends, ...friendships]
    allPosts.sort((a, b) => a.postUUID < b.postUUID ? 1 : a.postUUID > b.postUUID ? -1 : 0)

    /**
     * Format data to make it easier for the frontend to extract attributes
     * @param {*} item 
     * @returns {Object} formatted object
     */
    function formatData(item) {
      if (item.type == "friendship") {
        delete item.postUUID
        item.firstName = self.firstName
        item.lastName = self.lastName
      }
      return item
    }

    return _.map(allPosts, formatData)
  } catch (err) {
    throw err
  }

}

/**
 * Creates a Comment item in DynamoDB from a create comment request.
 * @param {Object} comment the request body of the create comment request
 * @return {Object} the new comment object from the database
 */
export async function createComment(body, postUUID, creatorUname) {
  const creator = await getUser(creatorUname)
  var postUUID = decodeURIComponent(postUUID)
  var creationTime = new Date().toISOString()
  const comment = {
    postUUID: postUUID,
    creatorUsername: creator.username,
    creatorFirstName: creator.firstName,
    creatorLastName: creator.lastName,
    timestamp: creationTime,
    commentUUID: creationTime + "#" + uuidv4(),
    content: zlib.gzipSync(body.content)
  }

  try {
    var created_post = await Comment.create(comment, { overwrite: false });
  } catch (err) {
    throw err;
  }
  return created_post
}

/**
 * Get comments on post corresponding to param postUUID
 * @param {*} postUUID
 * @returns {*}
 */
export async function getCommentsOnPost(postUUID) {

  try {
    function uncompressData(obj) {
      obj.content = zlib.gunzipSync(Buffer.from(obj.content.data)).toString()
      return obj
    }

    const callback = function (resp) {
      var mapped = _.map(resp.Items, (x) => unmarshallAttributes(x));
      return _.map(mapped, (x) => uncompressData(x))
    };
    var comments = await executeAsync(Comment.query(postUUID), callback)
    return comments
  } catch (err) {
    throw err;
  }
}