/**
 * This module defines various error classes that can be used to concisely express
 * error conditions and return the appropriate response.
 */

/** A base error class, adapted from https://sematext.com/blog/node-js-error-handling/. */
export class BaseError extends Error {
  /**
   * Create a BaseError object.
   * @param {string} message - A description of the error
   * @param {number} statusCode - The status code to return
   * @param {boolean} isOperational - Is this error an operational error?
   */
  constructor(message, statusCode, isOperational) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

/** A 404 error class. */
export class Api404Error extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Not found.',
      statusCode = httpStatusCodes.NOT_FOUND,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

// TODO: create more error classes
