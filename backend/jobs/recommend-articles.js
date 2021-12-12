import { loadNews } from './load-news.js';

/**
 * Loads news and then runs the livy job to recommend articles.
 */
export function recommendArticles() {
  loadNews();
  // TODO: start Livy job
}
