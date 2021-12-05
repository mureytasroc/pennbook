/**
 * This module contains the script to load news articles, and related helper functions.
 */

import stemmer from 'stemmer';
import sw from 'stopword';
import { BadRequest } from '../error/errors';

const isValidKeyword = /[a-zA-Z0-9]+/; // used in turnTextToKeywords

/**
 * A function to turn text into keywords.
 * @param {string} text - The text or query from which to extract keywords.
 * @throws {BadRequest} if the text contains any invalid keywords
 * @return {Object} An object {originalKeywords, dbKeywords}, where originalKeywords refers to
 *                  an array of the cleaned keywords originally in the text, and dbKeywords
 *                  refers to the stemmed/filtered keywords for use in the db.
*/
export function turnTextToKeywords(text) {
  // Split keywords by any whitespace (and trim)
  let keywords = text.trim().split(/s+/m).filter((keyw) => keyw);

  // Check for any non-alphabetic keywords
  const invalidKeywords = keywords.filter((keyw) => !isValidKeyword.test(keyw));
  if (invalidKeywords.length) {
    throw new BadRequest('Invalid keywords: ' + JSON.stringify(invalidKeywords));
  }

  // Convert keywords to lowercase and stem
  keywords = keywords.map((keyw) => keyw.toLowerCase());
  const stemmedKeywords = keywords.map((keyw) => stemmer(keyw));

  // Remove stop words
  return sw.removeStopwords(stemmedKeywords);
}
