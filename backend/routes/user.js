import bcrypt from 'bcrypt';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import owasp from 'owasp-password-strength-test';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { BadRequest, Forbidden, NotFound, TooManyRequests,
  Unauthenticated } from '../error/errors.js';
import { redisClient } from '../models/connect.js';
import { createUser, getAffiliations, getUser, updateUser, searchUsers } from '../models/User.js';
import { assertString, assertInt, cannotUpdate } from '../util/utils.js';
import { generateJwt } from './auth.js';
import {
  createFriendship, getFriendship,
  deleteFriendship, getFriendships,
  friendshipModelToResponse,
} from '../models/Friendship.js';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';
import { asyncHandler } from '../error/errorHandlers.js';

const router = new express.Router();


/**
 * List affiliations.
 */
router.get('/users/affiliations', asyncHandler(async function(req, res) {
  const affiliationsSet = await getAffiliations();
  res.json(Array.from(affiliationsSet));
}));


owasp.config({
  allowPassphrases: true,
  maxLength: 128,
  minLength: 10,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4,
});

/**
 * Create user.
 */
router.post('/users', asyncHandler(async function(req, res) {
  const profile = await createUser(req.body);
  profile.token = generateJwt(profile.username);
  res.status(StatusCodes.CREATED).json(profile);
}));


const limitFailedLoginsByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: process.env.MAX_LOGIN_FAILS_PER_DAY,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});


/**
 * Login.
 */
router.post('/users/:username/login', asyncHandler(async function(req, res) {
  const failedLoginLimit = await limitFailedLoginsByIP.get(req.ip);
  if (failedLoginLimit && failedLoginLimit.remainingPoints <= 0) {
    throw new TooManyRequests('Too many failed login attempts from your IP.');
  }
  const noMatchErr = new Unauthenticated('Invalid username/password combination.');
  let profile;
  try {
    profile = await getUser(req.params.username);
  } catch (err) {
    if (err instanceof NotFound) {
      throw noMatchErr;
    }
    throw err;
  }
  const password = assertString(req.body.password, 'password');
  const match = await bcrypt.compare(password, profile.passwordHash);
  if (!match) {
    await limitFailedLoginsByIP.consume(req.ip);
    throw noMatchErr;
  }
  profile.token = generateJwt(profile.username);
  delete profile.passwordHash;
  res.json(profile);
}));

/**
 * Update user.
 */
router.patch('/users/:username/profile', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  cannotUpdate(req.body, 'username');
  req.body.username = req.user.username;
  cannotUpdate(req.body, 'firstName');
  cannotUpdate(req.body, 'lastName');
  const newProfile = await updateUser(req.body);
  newProfile.token = req.signedToken; // do not refresh token; credentials have not been provided
  res.json(newProfile);
}));


/**
 * Search users.
 */
router.get('/users', asyncHandler(async function(req, res) {
  const query = assertString(req.query.q, 'q param').toLowerCase().trim().split(/\s+/).join(' ');
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 5000, 1, 10);
  const results = await searchUsers(query, page, limit);
  res.status(StatusCodes.OK).json(results);
}));


/**
 * Add friendship.
 */
router.post('/users/:username/friends/:friendUsername', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const friendUsername = assertString(req.params.friendUsername, 'friendUsername param');
  if (req.user.username === friendUsername) {
    throw new BadRequest('You cannot friend yourself.');
  }
  const friendship = await createFriendship(req.user.username, friendUsername);
  res.status(StatusCodes.CREATED).json(friendship);
}));

/**
 * Get friendship.
 */
router.get('/users/:username/friends/:friendUsername', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const friendUsername = assertString(req.params.friendUsername, 'friendUsername param');
  const friendship = await getFriendship(req.user.username, friendUsername);
  res.status(StatusCodes.OK).json(friendshipModelToResponse(friendship));
}));


/**
 * Remove friendship. Only need to call this for one direction, code will handle other direction
 */
router.delete('/users/:username/friends/:friendUsername', userAuthAndPathRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const friendUsername = assertString(req.params.friendUsername, 'friendUsername param');
  await deleteFriendship(req.user.username, friendUsername);
  res.status(StatusCodes.NO_CONTENT).end();
}));


/**
 * Get friendships.
 */
router.get('/users/:username/friends/', userAuthRequired, asyncHandler(async function(req, res) { // eslint-disable-line max-len
  const page = assertString(req.query.page, 'page param', 64, 1, '');
  const limit = assertInt(req.query.limit, 'limit param', 2000, 1, 10);
  const visualizationOrigin = assertString(
      req.query.visualizationOrigin, 'visualizationOrigin param', 64, 1, '');
  if (visualizationOrigin && visualizationOrigin !== req.user.username) {
    throw new Forbidden(`Origin parameter set to ${visualizationOrigin}, not authenticated user.`);
  }
  if (!visualizationOrigin && req.params.username !== req.user.username) {
    throw new Forbidden('Authenticated user does not match username in path.');
  }
  const friendships = await getFriendships(req.params.username, page, limit, visualizationOrigin);
  res.status(StatusCodes.OK).json(friendships);
}));

export default router;
