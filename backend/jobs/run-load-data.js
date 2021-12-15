import '../config/dotenv.js';
import '../error/errorHandlers.js';
import { loadAffiliations } from './load-affiliations.js';
import { loadNews } from './load-news.js';
import { prod } from '../config/dotenv.js';
import * as Sentry from '@sentry/node';

// Connect to Sentry (if Prod)
if (prod) {
  Sentry.init();
}

// Run manually with kubectl create job --from=cronjob/pennbook-load-data load-data

await loadAffiliations();
await loadNews();

process.exit(0);
