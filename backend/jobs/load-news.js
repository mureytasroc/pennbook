/**
 * This module contains the script to load news articles, and related helper functions.
 */
import '../models/connect.js';
import { stemmer } from 'stemmer';
import sw from 'stopword';
import { BadRequest } from '../error/errors.js';
import AWS from 'aws-sdk';
import { Category, Article, ArticleKeyword } from '../models/News.js';
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
  articleOb.category = articleOb.category.toLowerCase();
  delete articleOb.short_description;
  articleOb.articleUUID = date.toISOString() + uuidv5(articleOb.link, process.env.UUID_NAMESPACE);
  return articleOb;
}

/**
 * Loads new articles into DynamoDB
 */
export async function loadNews() {
  console.log('Loading news...');
  const batch = [];
  /**
   * Uploads the given batch of articles to DynamoDB
   * @param {Array} batch the batch of articles to upload
   */
  async function uploadArticleBatch(batch) {
    await Article.create(batch);
    await ArticleKeyword.create(batch.flatMap((article) =>
      turnTextToKeywords(article.headline).map(
          (keyword) => ({ keyword, articleUUID: article.articleUUID }),
      )));
    batch = [];
  };
  const categories = new Set();
  const s3 = new AWS.S3();
  const s = s3.getObject(
      { Bucket: prod ? 'pennbook' : 'pennbook-dev', Key: 'news.json' },
  ).createReadStream().pipe(es.split()).pipe(es.map(async function(line) {
    const article = parseAndCleanArticle(line);
    if (!article) {
      process.stdout.write('e');
      return;
    }
    if (article.date > new Date()) {
      if (batch.length) {
        await uploadArticleBatch(batch);
      }
      return;
    }
    if (article.category) {
      categories.add(article.category.toLowerCase());
    }
    batch.push(article);
    if (batch.length === 20) {
      await uploadArticleBatch(batch);
    }
  }));
  await new Promise((resolve, reject) => {
    s.on('end', resolve);
    s.on('error', reject);
  });
  console.log(`Done loading news.`);
  console.log('Loading categories...');
  await Category.create(Array.from(categories).map((c) => ({ category: c })));
  console.log(`Done loading categories.`);
}
