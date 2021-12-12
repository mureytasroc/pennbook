import dynamo from 'dynamodb';
import './Chat.js';
import './News.js';
import './Post.js';
import './User.js';
import { prod } from '../config/dotenv.js';
const { default: redis } = await import(prod ? 'redis' : 'redis-mock');

export const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});
redisClient.on('error', function(err) {
  throw err;
});

dynamo.createTables(function(err) {
  if (err && err.code !== 'ResourceInUseException') {
    throw err;
  }
});
