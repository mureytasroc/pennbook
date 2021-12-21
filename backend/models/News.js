import dynamo from 'dynamodb';
import Joi from 'joi';
import memoize from 'memoizee';
import { BadRequest, Conflict, NotFound } from '../error/errors.js';
import { unmarshallItem, queryGetList,
  checkThrowAWSError, queryGetListPageLimit,
  executeAsync, extractUserObject } from '../util/utils.js';
import { getUser } from './User.js';


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
    date: Joi.string(),
  },
});

/**
 * Converts the given dynamoDB article object to a response object.
 * @param {Object} article the dynamoDB article object
 * @return {Object} the converted response object
 */
export function articleModelToResponse(article) {
  return {
    articleUUID: article.articleUUID,
    likes: article.likes,
    category: article.category,
    headline: article.headline,
    authors: article.authors,
    shortDescription: article.shortDescription,
    date: article.date,
  };
}

/**
 * Augments each article in the given array with its like count
 * @param {Array} articles an array of articles to augment with like counts
 */
async function augmentArticlesWithLikes(articles) {
  const likes = await Promise.all(articles.map((a) =>
    executeAsync(ArticleLike.query(a.articleUUID).select('COUNT'))));
  return articles.map((a, i) => ({ likes: likes[i].Count, ...a }));
}

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
    articleDate: Joi.string(),
  },
});


/**
 * @return {Set} a set of valid news categories
 */
const getCategoriesUnmemoized = async function() {
  const categoriesSet = new Set();
  const data = await queryGetList(Category.scan().loadAll());
  data.forEach(({ category }) => categoriesSet.add(category));
  return categoriesSet;
};
export const getCategories = memoize(getCategoriesUnmemoized, { maxAge: 1000 * 60 * 60 });


/**
 * Gets an Article item from DynamoDB.
 * @param {string} articleUUID the UUID of the article to get
 * @return {Object} the article object
 */
export async function getArticle(articleUUID) {
  const article = await checkThrowAWSError(
      Article.get(articleUUID),
      'ResourceNotFoundException',
      new NotFound(`The article with UUID ${articleUUID} was not found.`));
  return unmarshallItem(article);
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
  const matchingArticles = await Promise.all(
      keywords.map((keyword) => queryGetList(ArticleKeyword.query(keyword).loadAll())));
  const articleUUIDtoMatchCount = new Map();
  const articleUUIDtoWeight = new Map();
  let maxMatchCount = 0;
  for (const articles of matchingArticles) {
    for (const article of articles) {
      const uuid = article.articleUUID;
      const count = articleUUIDtoMatchCount.get(uuid) || 0;
      articleUUIDtoMatchCount.set(uuid, count + 1);
      maxMatchCount = Math.max(maxMatchCount, count + 1);
      articleUUIDtoWeight.set(uuid, 0);
    }
  }

  if (page && !articleUUIDtoMatchCount.has(page)) {
    throw new BadRequest('Invalid page for given keywords: ' + page);
  }
  const startMatchCount = (page ? articleUUIDtoMatchCount.get(page) : maxMatchCount);

  const sortedEntries = Array.from(articleUUIDtoMatchCount.entries()).filter(
      ([_, matches]) => matches <= startMatchCount);
  sortedEntries.sort((a, b) => b[1] - a[1]); // sort in descending order by num matches
  if (!sortedEntries.length) {
    return [];
  }

  const articleUUIDsToRate = [];
  const matchCountSections = [];
  let currMatchCountSection = [];
  let currMatchCount = startMatchCount;
  let totalArticlesPastFirstSection = 0;
  let totalArticlesPastFirstSectionThresh = limit;
  let broken = false;
  for (const [uuid, count] of sortedEntries) {
    if (currMatchCount !== count) {
      // new section
      currMatchCount = count;
      matchCountSections.push(currMatchCountSection);
      currMatchCountSection = [];
      if (totalArticlesPastFirstSection >= totalArticlesPastFirstSectionThresh) {
        broken = true;
        break;
      }
    }
    if (count !== startMatchCount) {
      totalArticlesPastFirstSection += 1;
    } else if (!page) {
      totalArticlesPastFirstSectionThresh -= 1;
    }
    articleUUIDsToRate.push(uuid);
    currMatchCountSection.push(uuid);
  }
  if (!broken) {
    matchCountSections.push(currMatchCountSection);
  }

  const articleRatings = JSON.parse(JSON.stringify(await ArticleRanking.getItems(
      articleUUIDsToRate.map((uuid) => ({ username, articleUUID: uuid })))));

  for (const { articleUUID, adsorptionWeight } of articleRatings) {
    articleUUIDtoWeight.set(articleUUID, adsorptionWeight);
  }

  for (const section of matchCountSections) {
    // sort section in descending order by adsorption weight
    section.sort((a, b) => articleUUIDtoWeight.get(b) - articleUUIDtoWeight.get(a));
  }

  const finalUUIDs = matchCountSections.flat().slice(0, limit);
  const uuidToIdx = new Map();
  finalUUIDs.forEach((uuid, idx) => uuidToIdx.set(uuid, idx));
  const finalArticles = await augmentArticlesWithLikes(
      JSON.parse(JSON.stringify(await Article.getItems(finalUUIDs)))
          .sort((a, b)=>(uuidToIdx.get(a.articleUUID)-uuidToIdx.get(b.articleUUID))));
  return finalArticles.map(articleModelToResponse);
}


/**
 * Gets a page of recommended articles for the specified user.
 * @param {string} username the username of the user to recommend articles for
 * @param {string} page the recUUID to get recommendations less than
 * @param {number} limit the max number of results to return in the page
 * @return {Array} an array of article objects (recommended)
 */
export async function recommendArticles(username, page, limit) {
  const recsResult = await queryGetListPageLimit(
      RecommendedArticle.query(username), 'recUUID', page, limit,
  );
  const articleUUIDtoRecUUID = new Map();
  for (const rec of recsResult) {
    articleUUIDtoRecUUID.set(rec.articleUUID, rec.recUUID);
  }
  const articlesResult = JSON.parse(JSON.stringify(
      await Article.getItems(articleUUIDtoRecUUID.keys())));
  return articlesResult.map(
      (article) => ({ recUUID: articleUUIDtoRecUUID.get(article.articleUUID), ...article }),
  );
}

/**
 * Adds the specified like relationship to the ArticleLike table in DynamoDB.
 * @param {string} username the username of the user liking the article
 * @param {string} articleUUID the UUID of the article to like
 */
export async function likeArticle(username, articleUUID) {
  const [user, article] = await Promise.all([getUser(username), getArticle(articleUUID)]); // eslint-disable-line no-unused-vars, max-len
  try {
    await ArticleLike.create({ articleUUID, ...extractUserObject(user) }, { overwrite: false });
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
  const existingLike = await ArticleLike.destroy(
      { articleUUID, username },
      { ReturnValues: 'ALL_OLD' },
  );
  if (!existingLike) {
    throw new Conflict(`The username ${username} has not liked the article ${articleUUID}.`);
  }
}

/**
 * Get likes on article corresponding to param articleUUID
 * @param {string} articleUUID the UUID of the article to get likes from
 * @param {string} page the username to get likes less than
 * @param {number} limit the max number of likes to get
 * @return {Array} an array of the likes under the article
 */
export async function getLikesOnArticle(articleUUID, page, limit) {
  await getArticle(articleUUID);
  const likes = await queryGetListPageLimit(
      ArticleLike.query(articleUUID), 'username', page, limit, true);
  return likes.map((l) => extractUserObject(l));
}
