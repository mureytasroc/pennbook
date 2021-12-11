import express from 'express';
import { StatusCodes } from 'http-status-codes';
import routeCache from 'route-cache';
import { BadRequest } from '../error/errors.js';
import { turnTextToKeywords } from '../jobs/load-news.js';
import {
  articleSearch, getCategories, likeArticle, recommendArticles, unlikeArticle,
} from '../models/News.js';
import { userAuthAndPathRequired, userAuthRequired } from './auth.js';


const MAX_ARTICLE_QUERY_LIMIT = 100;

const router = new express.Router();

router.use(userAuthAndPathRequired.unless({
  path: ['/api/news/categories', '/api/news/articles'],
}));


/**
 * News categories.
 */
router.get('/news/categories', routeCache.cacheSeconds(60 * 60), async function(req, res) {
  const categoriesSet = await getCategories();
  res.json(Array.from(categoriesSet));
});


/**
 * News search.
 */
router.get('/news/articles', userAuthRequired, async function(req, res) {
  let keywords;
  try {
    keywords = turnTextToKeywords(req.query.q || '');
  } catch (err) {
    if (err instanceof BadRequest) {
      throw new BadRequest(
          'Invalid keywords in article query (keywords ' +
          'can only contain alphanumeric characters). ' + err.message,
      );
    }
    throw err;
  }
  const page = req.query.page || 'current';
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const articles = await articleSearch(req.body.username, keywords, page, limit);
  res.json(articles);
});


/**
 * News recommendations.
 */
router.get('/users/:username/recommended-articles', userAuthRequired, async function(req, res) {
  const page = req.query.page || 'current';
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  if (!limit || limit <= 0 || limit > MAX_ARTICLE_QUERY_LIMIT) {
    throw new BadRequest(
        `Invalid limit (must be an integer between 1 and ${MAX_ARTICLE_QUERY_LIMIT}).`,
    );
  }
  const articles = await recommendArticles(req.user.username, page, limit);
  res.json(articles);
});


/**
 * Like article.
 */
router.post('/users/:username/liked-articles/:articleUUID', async function(req, res) {
  await likeArticle(req.user.username, req.params.articleUUID);
  res.sendStatus(StatusCodes.CREATED);
});


/**
 * Unlike article.
 */
router.delete('/users/:username/liked-articles/:articleUUID', async function(req, res) {
  await unlikeArticle(req.user.username, req.params.articleUUID);
  res.sendStatus(StatusCodes.NO_CONTENT);
});


export default router;
