import express from 'express';
import { userAuthAndPathRequired, userAuthRequired } from './auth.js';

const router = new express.Router();
router.use(userAuthRequired.unless({ path: ['/api/users/:username/chats/'] }));


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
router.post('/chats', async function(req, res) {
  // TODO
});


/**
 * Delete chat
 */
router.delete('/chats/:chatUUID', async function(req, res) {
  // TODO
});


/**
 * Chat history.
 */
router.get('/chats/:chatUUID', async function(req, res) {
  // TODO
});


/**
 * Update chat details.
 */
router.put('/chats/:chatUUID', async function(req, res) {
  // TODO
});


export default router;
