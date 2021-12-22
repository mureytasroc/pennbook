import express from 'express';
import chat from './chat.js';
import news from './news.js';
import posts from './posts.js';
import user from './user.js';
import AWS from 'aws-sdk';
import { StatusCodes } from 'http-status-codes';
import { getUser } from '../models/User.js';
import * as https from 'https';

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
router.get('/ad/:username', async function(req, res, next) {
  try {
    const user = await getUser(req.params.username);
    const s3 = new AWS.S3();
    try {
      let prob;
      const options = {
        host: 'pennbook.app',
        path: '/predict',
        method: 'POST',
      };
      const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on('data', (d) => {
          prob = d;
        });
      });
      req.write(JSON.parse(user.interests));
      req.end();

      const r = Math.random() * prob;
      const url= await s3.getSignedUrlPromise('getObject',
          { Bucket: 'pennbook', Key: `ads/${r}.png` },
      );
      res.status(StatusCodes.OK).json({ 'url': url });
    } catch (err) {
      const r = 170001 + Math.floor(Math.random() * 8000);
      const url= await s3.getSignedUrlPromise('getObject',
          { Bucket: 'pennbook', Key: `ads/${r}.png` },
      );
      res.status(StatusCodes.OK).json({ 'url': url });
    }
  } catch (err) {
    next(err);
  }
},
);

export default router;
