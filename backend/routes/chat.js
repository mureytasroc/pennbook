import express from 'express';
import {
  getChatHistory, getChatInstance, getChatsOfUser,
  createChat, deleteChat, leaveChat,
} from '../models/Chat.js';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';
import { StatusCodes } from 'http-status-codes';
import { Forbidden } from '../error/errors.js';
import * as fs from 'fs';
const router = new express.Router();

/**
 * List chats by user.
 */
router.get('/users/:username/chats', userAuthAndPathRequired, async function(req, res, next) {
  try {
    const chats = await getChatsOfUser(req.params.username);
    res.status(StatusCodes.OK).json(chats);
  } catch (err) {
    next(err);
  }
});


/**
 * Start chat.
 */
router.post('/chats', userAuthRequired, async function(req, res, next) {
  try {
    const chat = await createChat(req.body);
    res.status(StatusCodes.OK).json(chat);
  } catch (err) {
    next(err);
  }
});


/**
 * Delete chat
 */
router.delete('/chats/:chatUUID', userAuthRequired, async function(req, res, next) {
  try {
    const chat = getChatInstance(req.params.chatUUID, req.user.username);
    if (chat.creatorUsername === req.user.username) {
      await deleteChat(req.params.chatUUID);
      res.status(StatusCodes.OK).end();
    } else {
      throw new Forbidden('You can\'t delete this chat unless you are the creator!');
    }
  } catch (err) {
    next(err);
  }
});

/**
 * Leave chat
 */
router.delete('/chats/:chatUUID/:username',
    userAuthAndPathRequired, async function(req, res, next) {
      try {
        await leaveChat(req.user.username, req.params.chatUUID);
        res.status(StatusCodes.OK).end();
      } catch (err) {
        next(err);
      }
    });


/**
 * Chat history.
 */
router.get('/chats/:chatUUID', userAuthRequired, async function(req, res, next) {
  try {
    // Assert user is part of chat
    await getChatInstance(req.params.chatUUID, req.user.username);
    const chatHistory = await getChatHistory(req.params.hatUUID);
    res.status(StatusCodes.OK).json(chatHistory);
  } catch (err) {
    next(err);
  }
});


/**
 * Test route for chats
 */
router.get('/chattest/', async function(req, res) {
  fs.readFile('./models/client/chat_example.html', function(err, content) {
    if (err) {
      console.log(err);
      res.status(404).end();
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
    }
  });
});

export default router;
