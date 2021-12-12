import express from 'express';
import { userAuthAndPathRequired } from './auth.js';

const router = new express.Router();

// router.use(userAuthRequired.unless({
//  path: ['/api/users/:username/wall', '/api/users/:username/home'],
// }));


/**
 * Add post to wall.
 */
router.post('/users/:username/wall', userAuthAndPathRequired, async function (req, res) {
  // TODO
});


/**
 * Get posts from wall.
 */
router.get('/users/:username/wall', async function (req, res) {
  // TODO
});


/**
 * Get home page posts.
 */
router.get('/users/:username/home', userAuthAndPathRequired, async function (req, res) {
  // TODO
});


/**
 * Post comment.
 */
router.post('/users/:username/wall/:postUUID/comments', async function (req, res) {
  // TODO
});


/**
 * Get comments.
 */
router.get('/users/:username/wall/:postUUID/comments', async function (req, res) {
  // TODO
});


export default router;
