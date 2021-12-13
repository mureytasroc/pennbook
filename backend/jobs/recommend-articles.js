import { loadNews } from './load-news.js';
import { loadAffiliations } from './load-affiliations.js';

/**
 * Loads news and then runs the livy job to recommend articles.
 */
export async function recommendArticles() {
  await Promise.all([loadAffiliations(), loadNews()]);
  // TODO: start Livy job
  console.log('Recommended.'); // TODO: remove
}
