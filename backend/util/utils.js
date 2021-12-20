import { BadRequest, UnprocessableEntity } from '../error/errors.js';

/**
 * A helper function to wrap DynamodDb API queries into promises
 * @param {Object} q the query to execute
 */
export async function executeAsync(q) {
  return await new Promise(function(resolve, reject) {
    q.exec(function(err, resp) {
      if (err) {
        reject(err);
      }
      resolve(resp);
    });
  });
}

/**
 * Extracts and marshalls the item from a dynamoDB get response
 * @param {Object} res a dynamoDB get response object
 * @return {Object} the marshalled item object
 */
export function unmarshallItem(res) {
  return JSON.parse(JSON.stringify(res));
}

/**
 * Extracts and marshalls the items from a dynamoDB query response
 * @param {Object} res a dynamoDB query response object
 * @return {Array} an array of the marshalled item objects
 */
export function unmarshallItems(res) {
  return JSON.parse(JSON.stringify(res.Items));
}

/**
 * Asserts the given toCheck variable is a string and (optionally) within the provided
 * length bounds, and throws a BadRequest mentioning the given name on failure.
 * @throws {BadRequest} if toCheck is not a string
 * @param {*} toCheck the variable to assert as a string
 * @param {string} name the name of the variable
 * @param {number} maxLength (optional) the max length of the string
 * @param {number} minLength (optional) the min length of the string
 * @param {string} defaultVal (optional) the default value if toCheck is falsy
 * @return {string} toCheck, guaranteed to be a string
 */
export function assertString(toCheck, name, maxLength, minLength, defaultVal) {
  if (!toCheck) {
    if (defaultVal !== undefined) {
      return defaultVal;
    }
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
 * Asserts the given toCheck variable is an int or a string representation of an int
 * and (optionally) within the provided bounds, and throws a BadRequest mentioning the
 * given name on failure.
 * @throws {BadRequest} if toCheck is invalid
 * @param {*} toCheck the variable to assert as an int
 * @param {string} name the name of the variable
 * @param {number} max (optional) the max value of the int
 * @param {number} min (optional) the min value of the int
 * @param {number} defaultVal (optional) the default value if toCheck is falsy
 * @return {number} toCheck, guaranteed to be an int
 */
export function assertInt(toCheck, name, max, min, defaultVal) {
  if (!toCheck) {
    if (defaultVal !== undefined) {
      return defaultVal;
    }
    throw new BadRequest(`${name} is required.`);
  }
  const parsedInt = parseInt(toCheck);
  if (parsedInt === NaN) {
    throw new BadRequest(`${name} must be an integer.`);
  }
  if (min && parsedInt < min) {
    throw new BadRequest(`${name} cannot be below ${min}.`);
  }
  if (max && parsedInt > max) {
    throw new BadRequest(`${name} cannot exceed ${max}.`);
  }
  return parsedInt;
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

/**
 * Returns a list of unmarshalled objects from a given query.
 * @param {Object} query a DynamoDB query to execute
 * @return {Array} a list of the returned objects in the query
 */
export async function queryGetList(query) {
  return unmarshallItems(await executeAsync(query));
}

/**
 * Extends the given query with paging, specified by the given page and limit
 * (sorts in descending order by default).
 * @param {Object} query a dynamoDB query to extend with paging
 * @param {string} sortKey the sort key to page on
 * @param {string} page the page to get (or falsy to get first page)
 * @param {number} limit the max number of results to return
 * @param {boolean} ascending (optional, default false) sort in ascending order
 */
export async function queryGetListPageLimit(query, sortKey, page, limit, ascending) {
  if (!ascending) {
    query = query.descending();
  }
  if (page) {
    query = query.where(sortKey);
    query = ascending ? query.gt(page) : query.lt(page);
  }
  return await queryGetList(query.limit(limit));
}

/**
 * Awaits the given promise representing an AWS query and checks any thrown
 * error for the given error code, if it matches then it throws the given
 * error object, otherwise rethrows the caught error.
 * @param {Object} promise the promise to await
 * @param {string} code the code to check for
 * @param {Object} error the error to throw if the given code matches
 * @return {Object} returns the result of the given promise execution
 */
export async function checkThrowAWSError(promise, code, error) {
  try {
    const res = await promise;
    if (!res && code === 'ResourceNotFoundException') {
      throw error;
    }
    return res;
  } catch (err) {
    if (err === error || err.code === code) {
      throw error;
    }
    throw err;
  }
}

/**
 * Removes duplicate instances of the specified field in the given array of objects.
 * @param {Array} arr the array of objects to deduplicate
 * @param {string} field the name of the field with which to detect duplicates
 * @return {Array} the deduplicated array
 */
export function removeDuplicatesByField(arr, field) {
  const seenVals = new Set();
  return arr.filter((ob) => {
    if (seenVals.has(ob[field])) {
      return false;
    }
    seenVals.add(ob[field]);
    return true;
  });
}

/**
 * Extracts a user object from the given data object, taking the
 * username/firstName/lastName from those fields with (optionally)
 * the specified prefix.
 * @param {Object} data the object from which to extract a user object
 * @param {string} prefix (optional) the prefix of the user fields in the data object to extract
 * @return {Object} an extracted user object of the form {username, firstName, lastName}
 */
export function extractUserObject(data, prefix) {
  return {
    username: data[prefix ? prefix + 'Username' : 'username'],
    firstName: data[prefix ? prefix + 'FirstName' : 'firstName'],
    lastName: data[prefix ? prefix + 'LastName' : 'lastName'],
  };
}

/**
 * Combines the given array of strings into a grammatically correct sentence
 * of strings.
 * @param {Array} arr an array of strings
 * @return {string} the sentence of combined strings
 */
export function toSentence(arr) {
  return arr.slice(0, -2).join(', ') +
    (arr.slice(0, -2).length ? ', ' : '') +
    arr.slice(-2).join(' and ');
}
