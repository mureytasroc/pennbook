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

export default router;
