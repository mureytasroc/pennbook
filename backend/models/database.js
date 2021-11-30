import dynamo from 'dynamodb';
dynamo.AWS.config.update({region: process.env.awsRegion});
// TODO: figure out how to handle DynamoDB in dev

// TODO: define tables, helper functions for querying
// https://www.npmjs.com/package/dynamodb
