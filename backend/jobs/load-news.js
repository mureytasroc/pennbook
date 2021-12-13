/**
 * This module contains the script to load news articles, and related helper functions.
 */

import '../models/connect.js';
import { stemmer } from 'stemmer';
import sw from 'stopword';
import { BadRequest } from '../error/errors.js';
import AWS from 'aws-sdk';
import linebyline from 'linebyline';
import { Article, ArticleKeyword } from '../models/News.js';
import { v5 as uuidv5 } from 'uuid';
import { prod } from '../config/dotenv.js';

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

/**
 * Parses and cleans the given article into object form.
 * @param {string} article the string of the article to parse
 * @return {Object} the parsed and cleaned article
 */
export function parseAndCleanArticle(article) {
  const articleOb = JSON.parse(article);
  const date = Date.parse(articleOb.date);
  date.setFullYear(date.getFullYear() + 4);
  articleOb.date = date;
  articleOb.shortDescription = articleOb.short_description;
  articleOb.articleUUID = date.toISOString() + uuidv5(articleOb.link, process.env.UUID_NAMESPACE);
  return articleOb;
}

/**
 * Loads new articles into DynamoDB
 */
export function loadNews() {
  const batch = [];
  const uploadArticleBatch = () => {
    Article.create(batch);
    ArticleKeyword.create(batch.flatMap((article) =>
      turnTextToKeywords(article.title).dbKeywords.map(
          (keyword) => ({ keyword, articleUUID: article.articleUUID }))));
    batch = [];
  };
  const s3 = new AWS.S3();
  const lineReader = linebyline(s3.getObject(
      { Bucket: prod ? 'pennbook' : 'pennbook-dev', Key: 'news.json' },
  ).createReadStream());
  lineReader.on('line', function(line) {
    const article = parseAndCleanArticle(line);
    if (article.date > new Date()) {
      if (batch.length) {
        uploadArticleBatch(batch);
      }
      lineReader.close();
      return;
    }
    batch.push(article);
    if (batch.length === 20) {
      uploadArticleBatch(batch);
    }
  });
}
