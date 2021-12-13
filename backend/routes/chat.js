import express from 'express';
import { userAuthRequired, userAuthAndPathRequired } from './auth.js';

const router = new express.Router();

// TODO: setup socket.io?


/**
 * List chats by user.
 */
router.get('/users/:username/chats', userAuthAndPathRequired, async function(req, res) {
  res.send('Unimplemented'); // TODO
});


/**
 * Start chat.
 */
router.post('/chats', userAuthRequired, async function(req, res) {
  res.send('Unimplemented'); // TODO
});


/**
 * Delete chat
 */
router.delete('/chats/:chatUUID', userAuthRequired, async function(req, res) {
  res.send('Unimplemented'); // TODO
});


/**
 * Chat history.
 */
router.get('/chats/:chatUUID', userAuthRequired, async function(req, res) {
  res.send('Unimplemented'); // TODO
});


/**
 * Update chat details.
 */
router.put('/chats/:chatUUID', userAuthRequired, async function(req, res) {
  res.send('Unimplemented'); // TODO
});


export default router;
