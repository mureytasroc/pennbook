import express from 'express';
import {
  getChatHistory, getChatInstance, getChatsOfUser,
  createChat, deleteChat, leaveChat, getChatWithMembers,
} from '../models/Chat.js';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';
import { StatusCodes } from 'http-status-codes';
import { Forbidden } from '../error/errors.js';
import { asyncHandler } from '../error/errorHandlers.js';
import * as fs from 'fs';
const router = new express.Router();

/**
 * List chats by user.
 */
router.get('/users/:username/chats', userAuthAndPathRequired, asyncHandler(async function(req, res, next) { // eslint-disable-line max-len
  try {
    const chats = await getChatsOfUser(req.user.username);
    res.status(StatusCodes.OK).json(chats);
  } catch (err) {
    next(err);
  }
}));


/**
 * Start chat.
 */
router.post('/chats', userAuthRequired, asyncHandler(async function(req, res, next) {
  try {
    const chat = await createChat(req.body);
    res.status(StatusCodes.OK).json(chat);
  } catch (err) {
    next(err);
  }
}));


/**
 * Delete chat
 */
router.delete('/chats/:chatUUID', userAuthRequired, asyncHandler(async function(req, res, next) {
  try {
    const chat = getChatInstance(req.user.username, req.params.chatUUID);
    if (chat.creatorUsername === req.user.username) {
      await deleteChat(req.params.chatUUID);
      res.status(StatusCodes.OK).end();
    } else {
      throw new Forbidden('You can\'t delete this chat unless you are the creator!');
    }
  } catch (err) {
    next(err);
  }
}));

/**
 * Leave chat
 */
router.delete('/chats/:chatUUID/:username', userAuthAndPathRequired, asyncHandler(async function(req, res, next) { // eslint-disable-line max-len
  try {
    await leaveChat(req.user.username, req.params.chatUUID);
    res.status(StatusCodes.OK).end();
  } catch (err) {
    next(err);
  }
}));

/**
 * Chat with members
 */
router.get('/chats/members/:chatUUID', userAuthRequired,
    asyncHandler(async function(req, res, next) {
      try {
        const chatMembers = await getChatWithMembers(req.params.chatUUID);
        res.status(StatusCodes.OK).json(chatMembers);
      } catch (err) {
        next(err);
      }
    }));

/**
 * Chat history.
 */
router.get('/chats/:chatUUID', userAuthRequired, asyncHandler(async function(req, res, next) {
  try {
    // Assert user is part of chat
    await getChatInstance(req.user.username, req.params.chatUUID);
    const chatHistory = await getChatHistory(req.params.chatUUID);
    res.status(StatusCodes.OK).json(chatHistory);
  } catch (err) {
    next(err);
  }
}));


/**
 * Test route for chats
 */
router.get('/chattest/', asyncHandler(async function(req, res) {
  fs.readFile('./models/client/chat_example.html', function(err, content) {
    if (err) {
      console.log(err);
      res.status(404).end();
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
    }
  });
}));

export default router;
