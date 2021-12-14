import dynamo from 'dynamodb';
import Joi from 'joi';
import { NotFound } from '../error/errors.js';
import { executeAsync, unmarshallAttributes } from '../util/utils.js';
import { getUser } from './User.js';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

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
    sender: Joi.string(),
  },
});

/**
 * Creates a Chat item in DynamoDB from a create post request.
 * @param {Object} chatObj the request body of the create chat request
 * @return {Object} the new post object from the database
 */
export async function createChat(chatObj) {
  try {
    const creator = await getUser(chatObj.creator);
    const CHAT_UUID = uuidv4();
    for (const user of chatObj.members) {
      const userObj = await getUser(user);
      const chat = {
        creatorUsername: creator.username,
        chatName: chatObj.name,
        username: userObj.username,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        chatUUID: CHAT_UUID,
      };
      // Create chat record ("membership") for each user
      await Chat.create(chat, { overwrite: false });
    }

    return { chatUUID: CHAT_UUID };
  } catch (err) {
    throw err;
  }
}


/**
 * Deletes a user from a chat
 * @param {*} username username of user to delete friendship from
 * @param {*} chatUUID UUID of chat to leave
 */
export async function leaveChat(username, chatUUID) {
  Chat.destroy(username, chatUUID, function(err) {
    if (err) {
      throw err;
    }
  });
}

/**
 * Delete a chat
 * @param {*} chatUUID UUID of chat to delete
 */
export async function deleteChat(chatUUID) {
  const chatWithMembers = await getChatWithMembers(chatUUID);
  const members = _.map(chatWithMembers, (item) => item.username);

  // Delete all instances of ChatUUID
  for (const member of members) {
    Chat.destroy(member, chatUUID, function(err) {
      if (err) {
        throw err;
      }
    });
  }
}


/**
 * Get a chat object with its members' details
 * @param {*} chatUUID UUID of chat
 * @return {*} list of Chat objects
 */
export async function getChatWithMembers(chatUUID) {
  const callback = function(resp) {
    return _.map(resp.Items, (x) => unmarshallAttributes(x));
  };
  const chats = await executeAsync(Chat.query(chatUUID).usingIndex('ChatMembersIndex'), callback);
  return chats;
}

/**
 * Get all chats a user is part of
 * @param {*} user user to fetch details of
 * @return {*} list of Chat objects
 */
export async function getChatsOfUser(user) {
  const callback = function(resp) {
    return _.map(resp.Items, (x) => unmarshallAttributes(x));
  };
  const chats = await executeAsync(Chat.query(user), callback);
  return chats;
}

/**
 * Get a chat instance with a particular member, or throw an error
 * @param {*} chatUUID UUID of chat
 * @param {*} username username of potential member
 * @return {*} corresponding chat object
 */
export async function getChatInstance(chatUUID, username) {
  const chat = await Chat.get(chatUUID, username, { ConsistentRead: true });

  if (!chat) {
    throw new NotFound('Chat instance doesn\'t exist!');
  }
  return unmarshallAttributes(chat);
}

/**
 * Creates a ChatHistory item in DynamoDB from a create post request.
 * @param {Object} body the request body of the create chat message request
 * @return {Object} the new post object from the database
 */
export async function createChatMessage(body) {
  try {
    const chatHistoryItem = {
      chatUUID: body.chatUUID,
      timestamp: new Date().toISOString(),
      message: body.message,
      sender: body.sender,
    };
    const chatHistoryCreated = await ChatHistory.create(chatHistoryItem, { overwrite: false });
    return chatHistoryCreated;
  } catch (err) {
    throw err;
  }
}

/**
 * Get a chat's history
 * @param {*} chatUUID UUID of chat
 * @return {*} list of ChatHistory objects
 */
export async function getChatHistory(chatUUID) {
  const callback = function(resp) {
    return _.map(resp.Items, (x) => unmarshallAttributes(x));
  };
  const chats = await executeAsync(ChatHistory.query(chatUUID).descending(), callback);
  return chats;
}
