import express from 'express';
import { getFriendship } from '../models/Friendship.js';
import { createPost, getPostsOnHomePage, getPostsOnWall, createComment, getCommentsOnPost } from '../models/Post.js';
import { StatusCodes } from 'http-status-codes';
import { userAuthAndPathRequired } from './auth.js';

const router = new express.Router();

// router.use(userAuthRequired.unless({
//  path: ['/api/users/:username/wall', '/api/users/:username/home'],
// }));

// TODO: ADD AUTH

/**
 * Add post to wall.
 */
router.post('/users/:username/wall', async function (req, res, next) {
  try {
    const wall_username = req.params.username
    if (wall_username != req.params.username)
      friendship = await getFriendship(wall_username, req.params.username)

    var post = await createPost(req.body, wall_username, req.params.username)
    res.status(StatusCodes.CREATED).json(post)

  } catch (err) {
    next(err)
  }
});


/**
 * Get posts from wall.
 */
router.get('/users/:username/wall', async function (req, res, next) {
  try {
    var posts = await getPostsOnWall(req.params.username)
    res.status(StatusCodes.OK).json(posts)
  } catch (err) {
    next(err)
  }
});


/**
 * Get home page posts.
 */
router.get('/users/:username/home', async function (req, res, next) {
  try {
    var posts = await getPostsOnHomePage(req.params.username)
    res.status(StatusCodes.OK).json(posts)
  } catch (err) {
    next(err)
  }
});


/**
 * Post comment.
 */
router.post('/users/:username/wall/:postUUID/comments', async function (req, res, next) {
  try {
    const wall_username = req.params.username
    if (wall_username != req.params.username)
      friendship = await getFriendship(wall_username, req.params.username)

    var comment = await createComment(req.body, req.params.postUUID, req.params.username)
    res.status(StatusCodes.CREATED).json(comment)

  } catch (err) {
    next(err)
  }
});


/**
 * Get comments.
 */
router.get('/users/:username/wall/:postUUID/comments', async function (req, res) {
  try {
    const wall_username = req.params.username
    if (wall_username != req.params.username)
      friendship = await getFriendship(wall_username, req.params.username)

    var comments = await getCommentsOnPost(req.params.postUUID)
    res.status(StatusCodes.OK).json(comments)
  } catch (err) {
    next(err)
  }
});

export default router;
