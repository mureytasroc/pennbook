import express from 'express';
import { assertFriendshipConfirmed } from '../models/Friendship.js';
import {
  createPost, getHomepageItems, getPostsOnWall,
  createComment, getCommentsOnPost, likePost, unlikePost, getLikesOnPost,
  getLikesOnComment, likeComment, unlikeComment,
} from '../models/Post.js';
import { StatusCodes } from 'http-status-codes';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';
import { assertString, assertInt } from '../util/utils.js';
import { BadRequest } from '../error/errors.js';
import { asyncHandler } from '../error/errorHandlers.js';

const router = new express.Router();


/**
 * Gets the wall username from the given request and asserts the wall username is
 * a friend of the requester.
 * @param {Object} req the request to get the wall username from
 * @return {string} the wall username
 */
async function getWallUsername(req) {
  const wallUsername = req.params.username;
  if (wallUsername != req.user.username) {
    await assertFriendshipConfirmed(wallUsername, req.user.username);
  }
  return wallUsername;
}

/**
 * Add post to wall.
 */
router.post('/users/:username/wall', userAuthRequired, asyncHandler(async function(req, res) {
  if (!req.body) {
    throw new BadRequest('Request body is required.');
  }
  if (req.body.type !== 'Status Update' && req.body.type !== 'Post') {
    throw new BadRequest('Post type must be one of Post, Status Update');
  }
  const wallUsername = await getWallUsername(req);
  if (req.body.type === 'Status Update' && wallUsername !== req.user.username) {
    throw new BadRequest('You cannot create a Status Update on someone else\'s wall.');
  }
  const postObj = {
    content: assertString(req.body.content, 'body content', 8000, 1),
    type: req.body.type,
  };
  const post = await createPost(postObj, req.user.username, wallUsername);
  res.status(StatusCodes.CREATED).json(post);
}));

/**
 * Like post.
 */
router.post('/users/:username/liked-posts/:postUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const postUUID = assertString(req.params.postUUID, 'postUUID', 64, 1);
  await likePost(req.user.username, postUUID);
  res.sendStatus(StatusCodes.CREATED);
}));


/**
 * Unlike post.
 */
router.delete('/users/:username/liked-posts/:postUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const postUUID = assertString(req.params.postUUID, 'postUUID', 64, 1);
  await unlikePost(req.user.username, postUUID);
  res.sendStatus(StatusCodes.NO_CONTENT);
}));


/**
 * Get page of post likes.
 */
router.get('/users/:username/wall/:postUUID/likes', userAuthRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const wallUsername = await getWallUsername(req);
  const postUUID = assertString(req.params.postUUID, 'postUUID', 64, 1);
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 5000, 1, 10);
  const likes = await getLikesOnPost(postUUID, wallUsername, page, limit);
  res.json(likes);
}));


/**
 * Get posts from wall.
 */
router.get('/users/:username/wall', userAuthRequired, asyncHandler(async function(req, res) {
  const wallUsername = await getWallUsername(req);
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 30, 1, 10);
  const posts = await getPostsOnWall(wallUsername, page, limit);
  res.status(StatusCodes.OK).json(posts);
}));


/**
 * Get home page posts.
 */
router.get('/users/:username/home', userAuthAndPathRequired, asyncHandler(async function(req, res) {
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 30, 1, 10);
  const posts = await getHomepageItems(req.user.username, page, limit);
  res.status(StatusCodes.OK).json(posts);
}));


/**
 * Post comment.
 */
router.post('/users/:username/wall/:postUUID/comments', userAuthRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  if (!req.body) {
    throw new BadRequest('Request body is required.');
  }
  const commentObj = { content: assertString(req.body.content, 'body content', 8000, 1) };
  const wallUsername = await getWallUsername(req);
  const postUUID = assertString(req.params.postUUID, 'postUUID param', 64, 1);
  const comment = await createComment(commentObj, postUUID, wallUsername, req.user.username);
  res.status(StatusCodes.CREATED).json(comment);
}));


/**
 * Get comments.
 */
router.get('/users/:username/wall/:postUUID/comments', userAuthRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const wallUsername = await getWallUsername(req);
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 30, 1, 10);
  const postUUID = assertString(req.params.postUUID, 'postUUID param', 64, 1);
  const comments = await getCommentsOnPost(postUUID, wallUsername, page, limit);
  res.status(StatusCodes.OK).json(comments);
}));


/**
 * Like comment.
 */
router.post('/users/:username/liked-comments/:postUUID/:commentUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const postUUID = assertString(req.params.postUUID, 'postUUID', 64, 1);
  const commentUUID = assertString(req.params.commentUUID, 'commentUUID', 64, 1);
  await likeComment(req.user.username, postUUID, commentUUID);
  res.sendStatus(StatusCodes.CREATED);
}));


/**
 * Unlike comment.
 */
router.delete('/users/:username/liked-comments/:postUUID/:commentUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const postUUID = assertString(req.params.postUUID, 'postUUID', 64, 1);
  const commentUUID = assertString(req.params.commentUUID, 'commentUUID', 64, 1);
  await unlikeComment(req.user.username, postUUID, commentUUID);
  res.sendStatus(StatusCodes.NO_CONTENT);
}));


/**
 * Get page of comment likes.
 */
router.get('/users/:username/wall/:postUUID/comment/:commentUUID/likes', userAuthRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const wallUsername = await getWallUsername(req);
  const postUUID = assertString(req.params.postUUID, 'postUUID', 64, 1);
  const commentUUID = assertString(req.params.commentUUID, 'postUUID', 64, 1);
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 5000, 1, 10);
  const likes = await getLikesOnComment(postUUID, wallUsername, commentUUID, page, limit);
  res.json(likes);
}));


export default router;
