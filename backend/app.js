import dotenvDefaults from 'dotenv-defaults';
import dotenvExpand from 'dotenv-expand';
dotenvExpand(dotenvDefaults.config());

import { logErrorMiddleware, returnError } from 'errors/errorHandlers';
import express from 'express';
import { initDynamoDB } from 'models/connect.js';
import api from './routes/api.js';

// Setup server
const app = express();
app.use(express.urlencoded());

// Connect to DB
initDynamoDB();

// Setup error handling middleware
app.use(logErrorMiddleware);
app.use(returnError);

// Routing
app.use('/api', api);

// Run the server
const server = app.listen(process.env.PORT);
console.log(`Server running on port ${server.address().port}.`);
