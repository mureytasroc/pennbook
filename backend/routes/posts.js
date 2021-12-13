import express from 'express';
import { getFriendship } from '../models/Friendship.js';
import {
  createPost, getPostsOnHomePage, getPostsOnWall,
  createComment, getCommentsOnPost,
} from '../models/Post.js';
import { StatusCodes } from 'http-status-codes';

const router = new express.Router();

// router.use(userAuthRequired.unless({
//  path: ['/api/users/:username/wall', '/api/users/:username/home'],
// }));

// TODO: ADD AUTH

/**
 * Add post to wall.
 */
router.post('/users/:username/wall', async function(req, res, next) {
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.params.username) {
      await getFriendship(wallUsername, req.params.username);
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
router.get('/users/:username/wall', async function(req, res, next) {
  try {
    const posts = await getPostsOnWall(req.params.username);
    res.status(StatusCodes.OK).json(posts);
  } catch (err) {
    next(err);
  }
});


/**
 * Get home page posts.
 */
router.get('/users/:username/home', async function(req, res, next) {
  try {
    const posts = await getPostsOnHomePage(req.params.username);
    res.status(StatusCodes.OK).json(posts);
  } catch (err) {
    next(err);
  }
});


/**
 * Post comment.
 */
router.post('/users/:username/wall/:postUUID/comments', async function(req, res, next) {
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.params.username) {
      await getFriendship(wallUsername, req.params.username);
    }

    const comment = await createComment(req.body, req.params.postUUID, req.params.username);
    res.status(StatusCodes.CREATED).json(comment);
  } catch (err) {
    next(err);
  }
});


/**
 * Get comments.
 */
router.get('/users/:username/wall/:postUUID/comments', async function(req, res, next) {
  try {
    const wallUsername = req.params.username;
    if (wallUsername != req.params.username) {
      await getFriendship(wallUsername, req.params.username);
    }

    const comments = await getCommentsOnPost(req.params.postUUID);
    res.status(StatusCodes.OK).json(comments);
  } catch (err) {
    next(err);
  }
});

export default router;
