import bcrypt from 'bcrypt';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import owasp from 'owasp-password-strength-test';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { NotFound, TooManyRequests, Unauthenticated } from '../error/errors';
import { redisClient } from '../models/connect.js';
import { createUser, getAffiliations, getUser, updateUser } from '../models/User';
import { assertString, cannotUpdate } from '../util/utils';
import { generateJwt, userAuthAndPathRequired } from './auth';

const router = new express.Router();

router.use(userAuthAndPathRequired.unless({ path: ['/api/users', '/api/users/affiliations'] }));


/**
 * List affiliations.
 */
router.get('/users/affiliations', async function(req, res) {
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
router.post('/users', async function(req, res) {
  const profile = await createUser(req.body);
  profile.token = generateJwt(profile.username);
  res.status(StatusCodes.CREATED).json(profile);
});


const limitFailedLoginsByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: process.env.maxWrongAttemptsByIPperDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});

/**
 * Login.
 */
router.post('/users/:username/login', async function(req, res) {
  const failedLoginLimit = await limitFailedLoginsByIP.get(req.ip);
  if (failedLoginLimit.remainingPoints <= 0) {
    throw new TooManyRequests('Too many failed login attempts from your IP.');
  }
  const noMatchErr = new Unauthenticated('Invalid username/password combination.');
  let profile;
  try {
    profile = await getUser(req.user.username);
  } catch (err) {
    if (err instanceof NotFound) {
      throw noMatchErr;
    }
    throw err;
  }
  const password = assertString(req.body.password, 'password');
  const match = await bcrypt.compare(password, profile.passwordHash);
  if (!match) {
    await limitFailedLoginsByIP.consume(1);
    throw noMatchErr;
  }
  profile.token = generateJwt(profile.username);
  res.json(profile);
});


/**
 * Update user.
 */
router.patch('/users/:username/profile', async function(req, res) {
  cannotUpdate(req.body, 'username');
  req.body.username = req.user.username;
  cannotUpdate(req.body, 'firstName');
  cannotUpdate(req.body, 'lastName');
  const newProfile = await updateUser(req.body);
  newProfile.token = req.signedToken; // do not refresh token; credentials have not been provided
  res.json(newProfile);
});


/**
 * Search users.
 */
router.get('/users', async function(req, res) {
  // TODO
});


/**
 * Add friendship.
 */
router.post('/users/:username/friends/:friendUsername', async function(req, res) {
  // TODO
});


/**
 * Remove friendship.
 */
router.delete('/users/:username/friends/:friendUsername', async function(req, res) {
  // TODO
});


export default router;
