import express from 'express';
import chat from './routes/chat';
import news from './routes/news';
import posts from './routes/posts';
import user from './routes/user';

const router = new express.Router();

router.use(chat);
router.use(news);
router.use(posts);
router.use(user);

export default router;
