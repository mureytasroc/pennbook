import bcrypt from 'bcrypt';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import owasp from 'owasp-password-strength-test';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { NotFound, TooManyRequests, Unauthenticated } from '../error/errors.js';
import { redisClient } from '../models/connect.js';
import { createUser, getAffiliations, getUser, updateUser } from '../models/User.js';
import { assertString, cannotUpdate } from '../util/utils.js';
import { generateJwt } from './auth.js';
import { createFriendship, getFriendship, deleteFriendship, getFriendships } from '../models/Friendship.js';
import { userAuthAndPathRequired } from './auth.js';

const router = new express.Router();


/**
 * List affiliations.
 */
router.get('/users/affiliations', async function (req, res) {
  const affiliationsSet = await getAffiliations();
  res.json(Array.from(affiliationsSet));
});


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
router.post('/users', async function (req, res, next) {
  try {
    const profile = await createUser(req.body);
    profile.token = generateJwt(profile.username);
    res.status(StatusCodes.CREATED).json(profile);
  } catch (err) {
    next(err);
  }
});


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
router.post('/users/:username/login', async function (req, res) {
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
  res.json(profile);
});

/**
 * Update user.
 */
router.patch('/users/:username/profile', userAuthAndPathRequired, async function (req, res, next) {
  try {
    cannotUpdate(req.body, 'username');
    req.body.username = req.params.username;
    cannotUpdate(req.body, 'firstName');
    cannotUpdate(req.body, 'lastName');
    const newProfile = await updateUser(req.body);
    newProfile.token = req.signedToken; // do not refresh token; credentials have not been provided
    res.json(newProfile);
  } catch (err) {
    next(err);
  }
});


/**
 * Search users.
 */
router.get('/users', async function (req, res) {
  res.send('Unimplemented'); // TODO
});


/**
 * Add friendship.
 */
router.post('/users/:username/friends/:friendUsername', userAuthAndPathRequired, async function (req, res, next) { // eslint-disable-line max-len
  try {
    const friendship = await createFriendship(req.params.username, req.params.friendUsername);
    res.status(StatusCodes.CREATED).json(friendship);
  } catch (err) {
    next(err);
  }
});

/**
 * Get friendship.
 */
router.get('/users/:username/friends/:friendUsername', userAuthAndPathRequired, async function (req, res, next) { // eslint-disable-line max-len
  try {
    const friendship = await getFriendship(req.params.username, req.params.friendUsername);
    res.status(StatusCodes.OK).json(friendship);
  } catch (err) {
    next(err);
  }
});


/**
 * Remove friendship. Only need to call this for one direction, code will handle other direction
 */
router.delete('/users/:username/friends/:friendUsername', userAuthAndPathRequired, async function (req, res, next) { // eslint-disable-line max-len
  try {
    deleteFriendship(req.params.username, req.params.friendUsername);
  } catch (err) {
    next(err);
  }
  res.status(200).end();
});


/**
 * Get friendship.
 */
router.get('/users/:username/friends/', userAuthAndPathRequired, async function (req, res, next) { // eslint-disable-line max-len
  try {
    const friendships = await getFriendships(req.params.username);
    res.status(StatusCodes.OK).json(friendships);
  } catch (err) {
    next(err);
  }
});

export default router;
