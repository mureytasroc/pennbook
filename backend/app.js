import './config/dotenv.js';
import { returnError } from './error/errorHandlers.js';
import './models/connect.js';
import express from 'express';
import api from './routes/api.js';
import { prod } from './config/dotenv.js';
import * as Sentry from '@sentry/node';

// Connect to Sentry (if Prod)
if (prod) {
  Sentry.init();
}

// Setup server
const app = express();

// Sentry Requests Hook
if (prod) {
  app.use(Sentry.Handlers.requestHandler());
}

app.use(express.json());

// Routing
app.use('/api', api);

// Setup error handling middleware
if (prod) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(returnError);

// Run the server
const server = app.listen(process.env.BACKEND_PORT);
console.log(`Server running on port ${server.address().port}.`);
