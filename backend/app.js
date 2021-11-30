import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import redis from 'redis';
import connectRedis from 'connect-redis';
import {logErrorMiddleware, returnError} from './errors/errorHandlers.js';

import api from './routes/api.js';

// Setup Redis
const redisClient = redis.createClient({
  host: process.env.redisHost,
  port: process.env.redisPort,
});
redisClient.on('error', function(err) {
  throw err;
});

// Setup server
const app = express();
app.use(express.urlencoded());
app.use(cookieParser());

// Setup sessions
const RedisStore = connectRedis(session);
app.use(
    session({
      store: new RedisStore({client: redisClient}),
      secret: process.env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // TODO: investigate these security options
        httpOnly: false,
        maxAge: 1000 * 60 * process.env.sessionMaxAgeMinutes,
      },
    }),
);

// Setup error handling middleware
app.use(logErrorMiddleware);
app.use(returnError);

// Routing
app.use('/api', api);

// Run the server
const server = app.listen(process.env.PORT);
console.log(`Server running on port ${server.address().port}.`);
