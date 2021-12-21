import express from 'express';
import chat from './chat.js';
import news from './news.js';
import posts from './posts.js';
import user from './user.js';
import AWS from 'aws-sdk';
import { StatusCodes } from 'http-status-codes';

const router = new express.Router();

router.use(chat);
router.use(news);
router.use(posts);
router.use(user);

/**
 * An example route for throwing an error, for demo purposes only. Of course in a real
 * app we would not expose something like this.
 */
router.get('/error-example', function(req, res) {
  throw new Error('Example error.');
});


/**
 * Get ads
 */
router.get('/ad/:username', async function(req, res) {
  req.params.username;
  const r = 170001 + Math.floor(Math.random() * 8000);
  const s3 = new AWS.S3();
  const url= await s3.getSignedUrlPromise('getObject',
      { Bucket: 'pennbook', Key: `ads/${r}.png` },
  );
  res.status(StatusCodes.OK).json({ 'url': url });
});

export default router;
