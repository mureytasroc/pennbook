import dynamo from 'dynamodb';
import redis from 'redis';

/**
 * Initializes a connection to DynamoDB (works for dev or prod).
 */
export function initDynamoDB() {
  if (process.env.NODE_ENV === 'production') {
    dynamo.AWS.config.update({ region: process.env.awsRegion });
  } else {
    // TODO: figure out how to handle DynamoDB in dev
  }
}

export const redisClient = redis.createClient({
  host: process.env.redisHost,
  port: process.env.redisPort,
});
redisClient.on('error', function(err) {
  throw err;
});
