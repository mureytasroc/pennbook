import { Chat, ChatHistory } from './Chat.js';
import { Friendship } from './Friendship.js';
import { Category, Article, ArticleLike, ArticleKeyword,
  ArticleRanking, RecommendedArticle } from './News.js';
import { Post, Comment } from './Post.js';
import { Affiliation, User, UserAutocomplete } from './User.js';
import redis from 'ioredis';

export const redisClient = process.env.REDIS_URL ?
  redis.createClient({ url: process.env.REDIS_URL, enableOfflineQueue: false }) :
  redis.createClient({ enableOfflineQueue: false });

redisClient.on('error', (err) => {
  throw err;
});

const tableAndOptions = [
  [Chat, {}],
  [ChatHistory, {}],
  [Friendship, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [Category, {}],
  [Article, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [ArticleLike, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [ArticleKeyword, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [ArticleRanking, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [RecommendedArticle, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [Post, {}],
  [Comment, {}],
  [Affiliation, { 'BillingMode': 'PAY_PER_REQUEST' }],
  [User, {}],
  [UserAutocomplete, {}],
];

for (const [table, options] of tableAndOptions) {
  try {
    await new Promise((resolve, reject) =>
      table.createTable(options, (err) => err ? reject(err) : resolve()));
  } catch (err) {
    if (err.code !== 'ResourceInUseException') {
      throw err;
    }
  }
}
