import express from 'express';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';

const router = new express.Router();

// TODO: setup socket.io?


/**
 * List chats by user.
 */
router.get('/users/:username/chats', userAuthAndPathRequired, async function(req, res) {
  // TODO
});


/**
 * Start chat.
 */
router.post('/chats', userAuthRequired, async function(req, res) {
  // TODO
});


/**
 * Delete chat
 */
router.delete('/chats/:chatUUID', userAuthRequired, async function(req, res) {
  // TODO
});


/**
 * Chat history.
 */
router.get('/chats/:chatUUID', userAuthRequired, async function(req, res) {
  // TODO
});


/**
 * Update chat details.
 */
router.put('/chats/:chatUUID', userAuthRequired, async function(req, res) {
  // TODO
});


export default router;
