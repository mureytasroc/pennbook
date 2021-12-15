/**
 * This module contains the script to load news articles, and related helper functions.
 */
import '../models/connect.js';
import { stemmer } from 'stemmer';
import { BadRequest } from '../error/errors.js';
import AWS from 'aws-sdk';
import { Category, Article, ArticleKeyword } from '../models/News.js';
import { v5 as uuidv5 } from 'uuid';
import { prod } from '../config/dotenv.js';
import keywordExtractor from 'keyword-extractor';
import LineByLineReader from 'line-by-line';

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
  let keywords = keywordExtractor.extract(text, { remove_duplicates: true });

  // Check for any non-alphabetic keywords
  const invalidKeywords = keywords.filter((keyw) => !isValidKeyword.test(keyw));
  if (throwError && invalidKeywords.length) {
    throw new BadRequest('Invalid keywords: ' + JSON.stringify(invalidKeywords));
  }
  keywords = keywords.filter((k) => !invalidKeywords.includes(k));

  // Convert keywords to lowercase and stem
  const stemmedKeywords = keywords.map((keyw) => stemmer(keyw));

  return stemmedKeywords;
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
  for (const key in articleOb) {
    if (articleOb[key] === '') {
      articleOb[key] = undefined;
    }
  }
  return articleOb;
}

/**
 * Loads new articles into DynamoDB
 */
export async function loadNews() {
  console.log('Loading news...');
  let batch = [];
  /**
   * Uploads the given batch of articles to DynamoDB
   * @param {Array} batch the batch of articles to upload
   */
  async function uploadArticleBatch() {
    await Article.create(batch);
    await ArticleKeyword.create(batch.flatMap((article) =>
      turnTextToKeywords(article.headline).map(
          (keyword) => ({ keyword, articleUUID: article.articleUUID }),
      )));
    batch = [];
  };
  const categoriesSet = new Set();
  const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    httpOptions: {
      timeout: 3600000, // 1 hour
    },
  });
  const lineReader = new LineByLineReader(s3.getObject(
      { Bucket: prod ? 'pennbook' : 'pennbook-dev', Key: 'news.json' },
  ).createReadStream());
  lineReader.on('line', async function(line) {
    const article = parseAndCleanArticle(line);
    if (!article) {
      process.stdout.write('e');
      return;
    }
    if (article.date > new Date()) {
      if (batch.length) {
        await uploadArticleBatch();
      }
      return;
    }
    batch.push(article);
    if (batch.length >= 20) {
      lineReader.pause();
      await uploadArticleBatch();
      lineReader.resume();
    }
  });
  await new Promise((resolve, reject) => {
    lineReader.on('end', resolve);
    lineReader.on('error', reject);
  });
  await Category.create(Array.from(categoriesSet).map((c) => ({ category: c })));
  console.log('Done loading news.');
}
