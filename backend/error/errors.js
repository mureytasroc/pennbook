/**
 * This module defines various error classes that can be used to concisely express
 * error conditions and return the appropriate response.
 */

import { StatusCodes } from 'http-status-codes';

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

/** A non-critical internal server error class (don't restart server). */
export class OperationalServerError extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Internal server error.',
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 400 bad request error class. */
export class BadRequest extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Bad request.',
      statusCode = StatusCodes.BAD_REQUEST,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 401 error class indicating that a user is unauthenticated. */
export class Unauthenticated extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Unauthenticated.',
      statusCode = StatusCodes.UNAUTHORIZED,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 403 error class indicating that a user is forbidden from accessing the desired resource. */
export class Forbidden extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'User is forbidden from accessing the desired resource.',
      statusCode = StatusCodes.FORBIDDEN,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 404 not found error class. */
export class NotFound extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Not found.',
      statusCode = StatusCodes.NOT_FOUND,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 409 conflict error class. */
export class Conflict extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Conflict.',
      statusCode = StatusCodes.CONFLICT,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 422 unprocessable entity error class. */
export class UnprocessableEntity extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Unprocessable entity.',
      statusCode = StatusCodes.UNPROCESSABLE_ENTITY,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

/** A 429 unprocessable entity error class. */
export class TooManyRequests extends BaseError {
  /** @inheritdoc */
  constructor(
      message = 'Too many requests.',
      statusCode = StatusCodes.TOO_MANY_REQUESTS,
      isOperational = true,
  ) {
    super(message, statusCode, isOperational);
  }
}

// TODO: create more error classes
