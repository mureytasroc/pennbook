import jwtMiddlewareConstructor from 'express-jwt';
import unless from 'express-unless';
import jwt from 'jsonwebtoken';
import { Forbidden, Unauthenticated } from '../error/errors.js';


const JWT_ALGORITHM = 'HS256';

const jwtMiddleware = jwtMiddlewareConstructor({
  secret: process.env.JWT_SECRET,
  algorithms: [JWT_ALGORITHM],
  getToken: function(req) {
    let signedToken;
    if (
      req.headers.authorization &&
      (req.headers.authorization.split(' ')[0] === 'Token' ||
        req.headers.authorization.split(' ')[0] === 'Bearer')) {
      signedToken = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      signedToken = req.query.token;
    } else {
      throw new Unauthenticated('User is not authenticated.');
    }
    req.signedToken = signedToken;
    return signedToken;
  },
});

/**
 * A middleware for routes that require user authentication.
 * @param {Object} req the request object
 * @param {Object} res the response object
 * @param {function} next the express next function
 */
export function userAuthRequired(req, res, next) {
  jwtMiddleware(req, res, function(error) {
    if (error) {
      next(new Unauthenticated(error.message));
    }
    next();
  });
};

/**
 * A middleware for routes that require user authentication.
 * The username field of the JWT will be checked against the username path parameter,
 * and a 403 will be returned if they do not match.
 * @param {Object} req the request object
 * @param {Object} res the response object
 * @param {function} next the express next function
 */
export function userAuthAndPathRequired(req, res, next) {
  userAuthRequired(req, res, function(error) {
    if (error) {
      next(error);
    }
    if (!req.user || req.params.username !== req.user.username) {
      next(new Forbidden('Authenticated user does not match username in path.'));
    }
    next();
  });
}
userAuthAndPathRequired.unless = unless;

/**
 * A function for signing a JWT with the given username (expiring in 1h).
 * @param {string} username the username with which this JWT will be signed
 * @return {Object} a signed JWT with the given username
 */
export function generateJwt(username) {
  return jwt.sign(
      { username },
      process.env.JWT_SECRET,
      {
        algorithm: JWT_ALGORITHM,
        expiresIn: '1h',
      },
  );
}
