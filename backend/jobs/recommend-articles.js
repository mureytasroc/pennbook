import { loadNews } from './load-news.js';
import { loadAffiliations } from './load-affiliations';

/**
 * Loads news and then runs the livy job to recommend articles.
 */
export function recommendArticles() {
  loadAffiliations();
  loadNews();
  // TODO: start Livy job
  console.log('Recommended.'); // TODO: remove
}
