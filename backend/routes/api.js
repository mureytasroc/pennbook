import express from 'express';
import chat from './chat.js';
import news from './news.js';
import posts from './posts.js';
import user from './user.js';

const router = new express.Router();

router.use(chat);
router.use(news);
router.use(posts);
router.use(user);

/**
 * An example route for throwing an error, for demo purposes only. Of course in a real
 * app we would not expose something like this.
 */
router.get('/error-example', async function(req, res) {
  throw new Error('Example error.');
});

export default router;
