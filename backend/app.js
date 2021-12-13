import './config/dotenv.js';
import { logErrorMiddleware, returnError } from './error/errorHandlers.js';
import './models/connect.js';
import './jobs/load-affiliations.js';
import './jobs/recommend-articles.js';
import express from 'express';
import api from './routes/api.js';

// Setup server
const app = express();
app.use(express.urlencoded());

// Routing
app.use('/api', api);

// Setup error handling middleware
app.use(logErrorMiddleware);
app.use(returnError);

// Run the server
const server = app.listen(process.env.BACKEND_PORT);
console.log(`Server running on port ${server.address().port}.`);
