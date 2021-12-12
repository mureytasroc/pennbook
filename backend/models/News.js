import dynamo from 'dynamodb';
import Joi from 'joi';
import memoize from 'memoizee';
import _ from 'lodash'
import { BadRequest, Conflict, NotFound, UnprocessableEntity } from '../error/errors.js';
import { unmarshallAttributes, executeAsync } from '../util/utils.js';


export const Category = dynamo.define('Category', {
  hashKey: 'category',
  schema: {
    category: Joi.string(),
  },
});

export const Article = dynamo.define('Article', {
  hashKey: 'articleUUID',
  schema: {
    articleUUID: Joi.string(),
    category: Joi.string(),
    headline: Joi.string(),
    authors: Joi.string(),
    link: Joi.string(),
    shortDescription: Joi.string(),
    date: Joi.date(),
  },
});

export const ArticleLike = dynamo.define('ArticleLike', {
  hashKey: 'articleUUID',
  rangeKey: 'username',
  schema: {
    articleUUID: Joi.string(),
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
  },
});

export const ArticleKeyword = dynamo.define('ArticleKeyword', {
  hashKey: 'keyword',
  rangeKey: 'articleUUID',
  schema: {
    keyword: Joi.string(),
    articleUUID: Joi.string(),
  },
});

export const ArticleRanking = dynamo.define('ArticleRanking', {
  hashKey: 'username',
  rangeKey: 'articleUUID',
  schema: {
    username: Joi.string(),
    articleUUID: Joi.string(),
    adsorptionWeight: Joi.number(),
  },
});

export const RecommendedArticle = dynamo.define('RecommendedArticle', {
  hashKey: 'username',
  rangeKey: 'recUUID',
  schema: {
    username: Joi.string(),
    recUUID: Joi.string(),
    articleUUID: Joi.string(),
  },
});


/**
 * @return {Set} a set of valid news categories
 */
const getCategoriesUnmemoized = async function () {
  const callback = function (resp) {
    return _.map(resp.Items, x => JSON.parse(JSON.stringify(x)).category)
  }
  const categoriesSet = new Set();
  var data = await executeAsync(Category.scan().loadAll(), callback)
  data.forEach((x, i) => categoriesSet.add(x))
  return categoriesSet;
};
export const getCategories = memoize(getCategoriesUnmemoized, { maxAge: 1000 * 60 * 60 });


/**
 * Gets an Article item from DynamoDB.
 * @param {string} articleUUID the UUID of the article to get
 * @return {Object} the article object
 */
export async function getArticle(articleUUID) {
  try {
    const article = await Article.get(articleUUID);
    return unmarshallAttributes(article.Attributes);
  } catch (err) {
    if (err.code === 'ResourceNotFoundException') {
      throw new NotFound(`The article with UUID ${articleUUID} was not found.`);
    }
    throw err;
  }
}


/**
 * Return a page of news article search results for the given keywords query,
 * paginated according to the specified page and limit.
 * @param {string} username the username of the user making the search
 * @param {Array} keywords an array of string keywords to search with
 * @param {string} page the articleUUID to get recommendations less than
 * @param {number} limit the max number of results to return in the page
 * @return {Array} an array of article objects (search results)
 */
export async function articleSearch(username, keywords, page, limit) {
  if (!keywords.length) {
    // TODO: Establish lower bound on number of queries? Test out in practice...
    throw new UnprocessableEntity('Query is unprocessable; make keywords more specific');
  }
  const matchingArticles = await Promise.all(
    keywords.map((keyword) =>
      ArticleKeyword.query(keyword)
        .loadAll()
        .exec()),
  );
  const articleUUIDtoMatchCount = new Map();
  const articleUUIDtoArticle = new Map();
  let maxMatchCount = 0;
  for (const res of matchingArticles) {
    for (const article of res.Items.map((item) => unmarshallAttributes(item))) {
      const uuid = article.articleUUID;
      const count = articleUUIDtoMatchCount.get(uuid) || 0;
      articleUUIDtoMatchCount.set(uuid, count + 1);
      maxMatchCount = Math.max(maxMatchCount, count + 1);
      articleUUIDtoArticle.set(uuid, article);
    }
  }

  if (page !== 'current' && !articleUUIDtoMatchCount.has(page)) {
    throw new BadRequest('Invalid page for given keywords: ' + page);
  }
  const startMatchCount = (page === 'current' ? maxMatchCount : articleUUIDtoMatchCount.get(page));

  const sortedEntries = articleUUIDtoMatchCount.entries().filter(
    ([_, matches]) => matches <= currMatchCount,
  );
  sortedEntries.sort((a, b) => b[1] - a[1]); // sort in descending order
  if (!sortedEntries.length) {
    return [];
  }

  const articleUUIDsToRate = [];
  const matchCountSections = [];
  const currMatchCountSection = [];
  const currMatchCount = startMatchCount;
  const totalArticlesPastFirstSection = 0;
  for (const [uuid, count] of sortedEntries) {
    if (currMatchCount !== count) {
      // new section
      currMatchCount = count;
      matchCountSections.push(currMatchCountSection);
      currMatchCountSection = [];
      if (totalArticlesPastFirstSection >= limit) {
        break;
      }
    }
    if (count !== startMatchCount) {
      totalArticlesPastFirstSection += 1;
    }
    articleUUIDsToRate.push(uuid);
    currMatchCountSection.push(uuid);
  }


  const articleRatings = await ArticleRanking.getItems(
    articleUUIDsToRate.map((uuid) => ({ username, articleUUID: uuid })),
  );

  const articleUUIDtoWeight = new Map();
  for (const { articleUUID, adsorptionWeight } of
    articleRatings.Items.map((item) => unmarshallAttributes(item))) {
    articleUUIDtoWeight.set(articleUUID, adsorptionWeight);
  }

  for (const section of matchCountSections) {
    section.sort((a, b) => articleUUIDtoWeight.get(b) - articleUUIDtoWeight.get(a)); // descending
  }

  return matchCountSections.flat().slice(0, limit);
}


/**
 * Gets a page of recommended articles for the specified user.
 * @param {string} username the username of the user to recommend articles for
 * @param {string} page the recUUID to get recommendations less than
 * @param {number} limit the max number of results to return in the page
 * @return {Array} an array of article objects (recommended)
 */
export async function recommendArticles(username, page, limit) {
  let recsResult;
  if (page === 'current') {
    recsResult = await RecommendedArticle.query(username)
      .limit(limit)
      .descending()
      .loadAll()
      .exec();
  } else {
    recsResult = await RecommendedArticle.query(username)
      .where('recUUID').lt(page)
      .limit(limit)
      .descending()
      .loadAll()
      .exec();
  }
  const articleUUIDtoRecUUID = new Map();
  for (const rec of recsResult.Items.map((item) => unmarshallAttributes(item))) {
    articleUUIDtoRecUUID.set(rec.articleUUID, rec.recUUID);
  }
  const articlesResult = await Article.getItems(articleUUIDtoRecUUID.keys());
  return articlesResult.Items.map((item) => unmarshallAttributes(item)).map(
    (article) => ({ recUUID: articleUUIDtoRecUUID.get(article.articleUUID), ...article }),
  );
}

/**
 * Adds the specified like relationship to the ArticleLike table in DynamoDB.
 * @param {string} username the username of the user liking the article
 * @param {string} articleUUID the UUID of the article to like
 */
export async function likeArticle(username, articleUUID) {
  try {
    await ArticleLike.create(
      { articleUUID, username },
      {
        ConditionExpression: `(articleUUID <> :auuid) or (username <> :uname)`,
        ExpressionAttributeValues: { ':auuid': articleUUID, ':uname': username },
      },
    );
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      throw new Conflict(`The username ${username} has already liked the article ${articleUUID}.`);
    }
    throw err;
  }
}

/**
 * Removes the specified like relationship from the ArticleLike table in DynamoDB.
 * @param {string} username the username of the user unliking the article
 * @param {string} articleUUID the UUID of the article to unlike
 */
export async function unlikeArticle(username, articleUUID) {
  const oldLike = await ArticleLike.destroy(
    { articleUUID, username },
    { ReturnValues: true },
  );
  if (!oldLike.Attributes) {
    throw new Conflict(`The username ${username} has not liked the article ${articleUUID}.`);
  }
}
