/**
 * This module contains the script to load news articles, and related helper functions.
 */
import '../models/connect.js';
import { stemmer } from 'stemmer';
import sw from 'stopword';
import { BadRequest } from '../error/errors.js';
import AWS from 'aws-sdk';
import { Article, ArticleKeyword } from '../models/News.js';
import { v5 as uuidv5 } from 'uuid';
import { prod } from '../config/dotenv.js';
import es from 'event-stream';

const isValidKeyword = /[a-zA-Z0-9]+/; // used in turnTextToKeywords

/**
 * A function to turn text into keywords.
 * @param {string} text - the text or query from which to extract keywords.
 * @param {boolean} throwError - whether to throw an error upon encountering invalid keywords
 * @throws {BadRequest} if the text contains any invalid keywords
 * @return {Array} the stemmed/filtered keywords for use in the db
*/
export function turnTextToKeywords(text, throwError) {
  // Split keywords by any whitespace (and trim)
  let keywords = text.trim().split(/s+/m).filter((keyw) => keyw);

  // Check for any non-alphabetic keywords
  const invalidKeywords = keywords.filter((keyw) => !isValidKeyword.test(keyw));
  if (throwError && invalidKeywords.length) {
    throw new BadRequest('Invalid keywords: ' + JSON.stringify(invalidKeywords));
  }
  keywords = keywords.filter((k) => !invalidKeywords.includes(k));

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
  let articleOb;
  try {
    articleOb = JSON.parse(article);
  } catch {
    return null;
  }
  const date = new Date(articleOb.date);
  date.setFullYear(date.getFullYear() + 4);
  articleOb.date = date;
  articleOb.shortDescription = articleOb.short_description;
  delete articleOb.short_description;
  articleOb.articleUUID = date.toISOString() + uuidv5(articleOb.link, process.env.UUID_NAMESPACE);
  if (articleOb.shortDescription === '' || articleOb.authors === '' || articleOb.headling === '') {
    return null; // filter out missing data
  }
  return articleOb;
}

/**
 * Loads new articles into DynamoDB
 */
export async function loadNews() {
  console.log('Loading news...');
  let batch = [];
  const uploadArticleBatch = () => {
    batch = batch.filter((a) =>
      a.authors && a.shortDescription && a.headline,
    ); // TODO: fix
    Article.create(batch);
    ArticleKeyword.create(batch.flatMap((article) =>
      turnTextToKeywords(article.headline).map(
          (keyword) => ({ keyword, articleUUID: article.articleUUID }),
      )));
    batch = [];
  };
  const s3 = new AWS.S3();
  const s = s3.getObject(
      { Bucket: prod ? 'pennbook' : 'pennbook-dev', Key: 'news.json' },
  ).createReadStream().pipe(es.split()).pipe(es.mapSync(function(line) {
    const article = parseAndCleanArticle(line);
    if (!article) {
      process.stdout.write('e');
      return;
    }
    if (article.date > new Date()) {
      if (batch.length) {
        uploadArticleBatch(batch);
      }
      return;
    }
    batch.push(article);
    if (batch.length === 20) {
      uploadArticleBatch(batch);
    }
  }));
  await new Promise((resolve, reject) => {
    s.on('end', resolve); s.on('error', reject);
  });
  console.log(`Done loading news.`);
}
