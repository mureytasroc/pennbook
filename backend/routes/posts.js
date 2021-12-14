import express from 'express';
import { getFriendship } from '../models/Friendship.js';
import {
  createPost, getPostsOnHomePage, getPostsOnWall,
  createComment, getCommentsOnPost,
} from '../models/Post.js';
import { StatusCodes } from 'http-status-codes';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';

const router = new express.Router();


/**
 * Add post to wall.
 */
router.post('/users/:username/wall', userAuthRequired, async function(req, res, next) {
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.user.username) {
      await getFriendship(wallUsername, req.user.username);
    }

    const post = await createPost(req.body, wallUsername, req.params.username);
    res.status(StatusCodes.CREATED).json(post);
  } catch (err) {
    next(err);
  }
});


/**
 * Get posts from wall.
 */
router.get('/users/:username/wall', userAuthRequired, async function(req, res, next) {
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.user.username) {
      await getFriendship(wallUsername, req.user.username);
    }

    const posts = await getPostsOnWall(wallUsername);
    res.status(StatusCodes.OK).json(posts);
  } catch (err) {
    next(err);
  }
});


/**
 * Get home page posts.
 */
router.get('/users/:username/home', userAuthAndPathRequired, async function(req, res, next) {
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.user.username) {
      await getFriendship(wallUsername, req.user.username);
    }

    const posts = await getPostsOnHomePage(wallUsername);
    res.status(StatusCodes.OK).json(posts);
  } catch (err) {
    next(err);
  }
});


/**
 * Post comment.
 */
router.post('/users/:username/wall/:postUUID/comments', userAuthRequired, async function(req, res, next) { // eslint-disable-line max-len
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.user.username) {
      await getFriendship(wallUsername, req.user.username);
    }

    const comment = await createComment(req.body, req.params.postUUID, wallUsername);
    res.status(StatusCodes.CREATED).json(comment);
  } catch (err) {
    next(err);
  }
});


/**
 * Get comments.
 */
router.get('/users/:username/wall/:postUUID/comments', userAuthRequired, async function(req, res, next) { // eslint-disable-line max-len
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.user.username) {
      await getFriendship(wallUsername, req.user.username);
    }

    const comments = await getCommentsOnPost(req.params.postUUID);
    res.status(StatusCodes.OK).json(comments);
  } catch (err) {
    next(err);
  }
});


export default router;
