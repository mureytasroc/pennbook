/**
 * This module defines various error handling middleware and helper functions,
 * and sets up proper error handling, following https://sematext.com/blog/node-js-error-handling/.
 */

import { BaseError } from './errors.js';


/**
 * A helper function to determine if the given error is an operational error.
 * @param {Object} error - The error object to inspect
 * @return {boolean} true if the error is an operational error, false otherwise
 */
export function isOperationalError(error) {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

/**
 * A middleware wrapper to return the appropriate response for an error.
 * @param {Object} err - The error object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware callback
 */
export function returnError(err, req, res, next) {
  if (!isOperationalError(err)) {
    console.error(err);
  }
  res.status(err.statusCode || 500).json({ message: err.message });
}

/**
 * Converts an async function to a synchronous express route handler function,
 * properly handling rejected promises.
 * @param {function} fn an async route handler function to handle
 * @return {function} a route handler function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};
