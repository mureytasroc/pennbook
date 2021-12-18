import express from 'express';
import { StatusCodes } from 'http-status-codes';
import routeCache from 'route-cache';
import { turnTextToKeywords } from '../jobs/load-news.js';
import {
  articleSearch, getCategories, likeArticle, recommendArticles, unlikeArticle,
} from '../models/News.js';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';
import { assertString, assertInt } from '../util/utils.js';
import { asyncHandler } from '../error/errorHandlers.js';

const router = new express.Router();


/**
 * News categories.
 */
router.get('/news/categories', routeCache.cacheSeconds(60 * 60), asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const categoriesSet = await getCategories();
  res.json(Array.from(categoriesSet));
}));


/**
 * News search.
 */
router.get('/news/articles', userAuthRequired, async function(req, res) {
  const keywords = turnTextToKeywords(decodeURIComponent(
      assertString(req.query.q, 'q param', 200, 1), true));
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 2000, 1, 10);
  const articles = await articleSearch(req.user.username, keywords, page, limit);
  res.json(articles);
});


/**
 * News recommendations.
 */
router.get('/users/:username/recommended-articles', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 2000, 1, 10);
  const articles = await recommendArticles(req.user.username, page, limit);
  res.json(articles);
}));


/**
 * Like article.
 */
router.post('/users/:username/liked-articles/:articleUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const articleUUID = assertString(req.params.articleUUID, 'articleUUID', 64, 1, '');
  await likeArticle(req.user.username, articleUUID);
  res.sendStatus(StatusCodes.CREATED);
}));


/**
 * Unlike article.
 */
router.delete('/users/:username/liked-articles/:articleUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const articleUUID = assertString(req.params.articleUUID, 'articleUUID', 64, 1, '');
  await unlikeArticle(req.user.username, articleUUID);
  res.sendStatus(StatusCodes.NO_CONTENT);
}));


export default router;
