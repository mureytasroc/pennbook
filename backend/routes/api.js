import express from 'express';
import chat from './routes/chat.js';
import news from './routes/news.js';
import posts from './routes/posts.js';
import user from './routes/user.js';

const router = new express.Router();

router.use(chat);
router.use(news);
router.use(posts);
router.use(user);

export default router;
