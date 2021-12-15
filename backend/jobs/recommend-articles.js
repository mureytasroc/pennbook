import { loadNews } from './load-news.js';

/**
 * Loads news and then runs the livy job to recommend articles.
 */
export async function recommendArticles() {
  // TODO: check if job currently running

  // Load new articles since yesterday
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 1);
  await loadNews(minDate);

  // TODO: start Livy job
  console.log('Recommended.'); // TODO: remove

  // TODO: mark job as finished
}
