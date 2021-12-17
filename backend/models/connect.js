import dynamo from 'dynamodb';
import './Chat.js';
import './News.js';
import './Post.js';
import './User.js';
import redis from 'ioredis';

export const redisClient = process.env.REDIS_URL ?
  redis.createClient({ url: process.env.REDIS_URL, enableOfflineQueue: false }) :
  redis.createClient({ enableOfflineQueue: false });

redisClient.on('error', (err) => {
  throw err;
});

dynamo.createTables(function(err) {
  if (err && err.code !== 'ResourceInUseException') {
    throw err;
  }
});
