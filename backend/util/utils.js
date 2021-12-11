import dynamo from 'dynamodb';
import { BadRequest, UnprocessableEntity } from '../error/errors.js';

export const unmarshallAttributes = dynamo.AWS.DynamoDB.Converter.unmarshall;

/**
 * Asserts the given toCheck variable is a string and (optionally) within the provided
 * length bounds, and throws a BadRequest mentioning the given name on failure.
 * @throws {BadRequest} if toCheck is not a string
 * @param {*} toCheck the variable to assert as a string
 * @param {string} name the name of the variable
 * @param {number} maxLength (optional) the max length of the string
 * @param {number} minLength (optional) the min length of the string
 * @return {string} toCheck, guaranteed to be a string
 */
export function assertString(toCheck, name, maxLength, minLength) {
  if (!toCheck) {
    throw new BadRequest(`${name} is required.`);
  }
  if (typeof toCheck !== 'string' && !(toCheck instanceof String)) {
    throw new BadRequest(`${name} must be provided as a string.`);
  }
  if (maxLength !== undefined && toCheck.length > maxLength) {
    throw new BadRequest(`The length of ${name} cannot exceed ${maxLength}.`);
  }
  if (minLength !== undefined && toCheck.length < minLength) {
    throw new BadRequest(`The length of ${name} cannot be less than ${minLength}.`);
  }
  return toCheck;
}

/**
 * Asserts that the specified field is not in the given object, and
 * throws a BadRequest telling the user they cannot update that field on failure.
 * @throws {UnprocessableEntity} if field is in object
 * @param {Object} object the object to validate
 * @param {string} field the field that cannot be updated
 * @return {Object} the validated object, on success
 */
export function cannotUpdate(object, field) {
  if (field in object) {
    throw new UnprocessableEntity(`You cannot update ${field}.`);
  }
  return object;
}
