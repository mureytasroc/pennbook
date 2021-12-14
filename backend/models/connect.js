import dynamo from 'dynamodb';
import './Chat.js';
import './News.js';
import './Post.js';
import './User.js';
import { prod } from '../config/dotenv.js';
import * as redis from 'redis';

export const redisClient = process.env.REDIS_URL ? redis.createClient({ url: process.env.REDIS_URL }) : redis.createClient();

(async () => {
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
})();


dynamo.createTables(function(err) {
  if (err && err.code !== 'ResourceInUseException') {
    throw err;
  }
});
