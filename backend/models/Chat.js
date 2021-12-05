import dynamo from 'dynamodb';
import Joi from 'joi';

export const Chat = dynamo.define('Chat', {
  hashKey: 'username',
  rangeKey: 'chatUUID',
  schema: {
    username: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    chatUUID: Joi.string(),
    chatName: Joi.string(),
    creatorUsername: Joi.string(),
  },
  indexes: [{
    hashKey: 'chatUUID', rangeKey: 'username', type: 'global', name: 'ChatMembersIndex',
  }],
});

export const ChatHistory = dynamo.define('ChatHistory', {
  hashKey: 'chatUUID',
  rangeKey: 'timestamp',
  schema: {
    chatUUID: Joi.string(),
    timestamp: Joi.date(),
    message: Joi.string(),
  },
});
