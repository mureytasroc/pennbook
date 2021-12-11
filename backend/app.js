import './config/dotenv.js';
import './models/connect.js';
import { logErrorMiddleware, returnError } from './error/errorHandlers.js';
import express from 'express';
import api from './routes/api.js';

// Setup server
const app = express();
app.use(express.urlencoded());

// Setup error handling middleware
app.use(logErrorMiddleware);
app.use(returnError);

// Routing
app.use('/api', api);

// Run the server
const server = app.listen(process.env.PORT);
console.log(`Server running on port ${server.address().port}.`);
