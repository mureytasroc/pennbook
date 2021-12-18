import { Chat, ChatHistory } from './Chat.js';
import { Friendship } from './Friendship.js';
import { Category, Article, ArticleLike, ArticleKeyword,
  ArticleRanking, RecommendedArticle } from './News.js';
import { Post, Comment } from './Post.js';
import { Affiliation, User, UserAutocomplete } from './User.js';
import Redis from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL || undefined);

redisClient.on('error', (err) => {
  throw err;
});

const tableAndOptions = [
  [Chat, {}],
  [ChatHistory, {}],
  [Friendship, { BillingMode: 'PAY_PER_REQUEST' }],
  [Category, {}],
  [Article, { BillingMode: 'PAY_PER_REQUEST' }],
  [ArticleLike, { BillingMode: 'PAY_PER_REQUEST' }],
  [ArticleKeyword, { BillingMode: 'PAY_PER_REQUEST' }],
  [ArticleRanking, { BillingMode: 'PAY_PER_REQUEST' }],
  [RecommendedArticle, { BillingMode: 'PAY_PER_REQUEST' }],
  [Post, {}],
  [Comment, {}],
  [Affiliation, { BillingMode: 'PAY_PER_REQUEST' }],
  [User, {}],
  [UserAutocomplete, { BillingMode: 'PAY_PER_REQUEST' }],
];

for (const [table, options] of tableAndOptions) { // eslint-disable-line no-unused-vars
  try {
    await new Promise((resolve, reject) =>
      table.createTable((err) => err ? reject(err) : resolve()));
  } catch (err) {
    if (err.code !== 'ResourceInUseException') {
      throw err;
    }
    await table.updateTable();
  }
}

await Promise.all(tableAndOptions.map(([table, options]) =>
  table.docClient.service.updateTable({
    TableName: table.tableName(),
    ...options,
  }),
));
