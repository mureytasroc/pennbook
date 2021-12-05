import dynamo from 'dynamodb';
import Joi from 'joi';

export const Post = dynamo.define('Post', {
  hashKey: 'username',
  rangeKey: 'postUUID',
  schema: {
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    postUUID: Joi.string(),
    creatorUsername: Joi.string(),
    creatorFirstName: Joi.string(),
    creatorLastName: Joi.string(),
    type: Joi.string(),
    content: Joi.binary(),
  },
  indexes: [{
    hashKey: 'creatorUsername', rangeKey: 'postUUID', type: 'global', name: 'CreatorPostsIndex',
  }],
});

export const Comment = dynamo.define('Comment', {
  hashKey: 'postUUID',
  rangeKey: 'commentUUID',
  schema: {
    postUUID: Joi.string(),
    commentUUID: Joi.string(),
    timestamp: Joi.date(),
    creatorUsername: Joi.string(),
    creatorFirstName: Joi.string(),
    creatorLastName: Joi.string(),
    content: Joi.binary(),
  },
});
