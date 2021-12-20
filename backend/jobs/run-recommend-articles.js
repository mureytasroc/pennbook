import '../config/dotenv.js';
import '../error/errorHandlers.js';
import { recommendArticles } from './recommend-articles.js';
import { prod } from '../config/dotenv.js';
import '../models/connect.js';
import * as Sentry from '@sentry/node';

// Connect to Sentry (if Prod)
if (prod) {
  Sentry.init();
}

await recommendArticles();

process.exit(0);
