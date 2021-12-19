import express from 'express';
import { StatusCodes } from 'http-status-codes';
import routeCache from 'route-cache';
import { turnTextToKeywords } from '../jobs/load-news.js';
import {
  articleSearch, getCategories, getLikesOnArticle, likeArticle, recommendArticles, unlikeArticle,
} from '../models/News.js';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';
import { assertString, assertInt } from '../util/utils.js';
import { asyncHandler } from '../error/errorHandlers.js';
import { BadRequest } from '../error/errors.js';

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
router.get('/news/articles', userAuthRequired, asyncHandler(async function(req, res) {
  const keywords = turnTextToKeywords(decodeURIComponent(
      assertString(req.query.q, 'q param', 200, 1), true));
  if (!keywords.length) {
    throw new BadRequest('No descriptive keywords found. Please make a more descriptive search.');
  }
  const page = assertString(req.query.page, 'page param', 70, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 2000, 1, 10);
  const articles = await articleSearch(req.user.username, keywords, page, limit);
  res.json(articles);
}));


/**
 * News recommendations.
 */
router.get('/users/:username/recommended-articles', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const page = assertString(req.query.page, 'page param', 70, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 2000, 1, 10);
  const articles = await recommendArticles(req.user.username, page, limit);
  res.json(articles);
}));


/**
 * Like article.
 */
router.post('/users/:username/liked-articles/:articleUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const articleUUID = assertString(req.params.articleUUID, 'articleUUID', 70, 1);
  await likeArticle(req.user.username, articleUUID);
  res.sendStatus(StatusCodes.CREATED);
}));


/**
 * Unlike article.
 */
router.delete('/users/:username/liked-articles/:articleUUID', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const articleUUID = assertString(req.params.articleUUID, 'articleUUID', 70, 1);
  await unlikeArticle(req.user.username, articleUUID);
  res.sendStatus(StatusCodes.NO_CONTENT);
}));


/**
 * Get page of article likes.
 */
router.get('/news/articles/:articleUUID/likes', asyncHandler(async function(req, res) {
  const articleUUID = assertString(req.params.articleUUID, 'articleUUID', 70, 1);
  const page = assertString(req.query.page, 'page param', 70, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 5000, 1, 10);
  const likes = await getLikesOnArticle(articleUUID, page, limit);
  res.json(likes);
}));


export default router;
