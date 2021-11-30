/**
 * This module defines various error handling middleware and helper functions,
 * and sets up proper error handling, following https://sematext.com/blog/node-js-error-handling/.
 */

import {BaseError} from './errorHandlers.js';

/**
 * Log the given error appropriately, depending on environment.
 * @param {object} err - The error object to log
 */
export function logError(err) {
  console.error(err);
}

/**
 * A middleware wrapper around {@link logError}.
 * @param {object} err - The error object to log
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware callback
 */
export function logErrorMiddleware(err, req, res, next) {
  logError(err);
  next(err);
}

/**
 * A middleware wrapper to return the appropriate response for an error.
 * @param {object} err - The error object
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware callback
 */
export function returnError(err, req, res, next) {
  res.status(err.statusCode || 500).json({message: err.message});
}

/**
 * A helper function to determine if the given error is an operational error.
 * @param {object} error - The error object to inspect
 * @return {boolean} true if the error is an operational error, false otherwise
 */
export function isOperationalError(error) {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

// Throw an error on unhandled promise rejection
process.on('unhandledRejection', (error) => {
  throw error;
});

// Decide whether to restart server on unhandled error
process.on('uncaughtException', (error) => {
  logError(error);

  if (!isOperationalError(error)) {
    process.exit(1);
  }
});
