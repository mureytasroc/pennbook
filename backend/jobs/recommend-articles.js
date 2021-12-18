import { loadNews } from './load-news.js';
import { redisClient } from '../models/connect.js';

/**
 * Loads news and then runs the livy job to recommend articles.
 */
export async function recommendArticles() {
  if (JSON.parse(await redisClient.get('RECOMMENDER_RUNNING'))) {
    await redisClient.set('RECOMMENDER_RUN_WHEN_DONE', JSON.stringify(true));
    return;
  }
  await redisClient.set('RECOMMENDER_RUNNING', JSON.stringify(true));

  // Load new articles since yesterday
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 1);
  await loadNews(minDate);

  // TODO: start Livy job
  console.log('Recommended.'); // TODO: remove

  await redisClient.set('RECOMMENDER_RUNNING', JSON.stringify(false));
  if (JSON.parse(await redisClient.get('RECOMMENDER_RUN_WHEN_DONE'))) {
    await redisClient.set('RECOMMENDER_RUN_WHEN_DONE', JSON.stringify(false));
    return recommendArticles();
  }
}
