import './config/dotenv.js';
import { returnError } from './error/errorHandlers.js';
import './models/connect.js';
import express from 'express';
import api from './routes/api.js';
import { Server } from 'socket.io';
import { leaveChat } from './models/Chat.js';
import { redisClient } from './models/connect.js';
import * as Sentry from '@sentry/node';
import { prod } from './config/dotenv.js';
import cors from 'cors';
import { getChatInstance, createChatMessage } from './models/Chat.js';
import { setOnlineStatus } from './models/User.js';

if (prod) {
  Sentry.init();
}
// Setup server
const app = express();

const CORS_POLICY = prod ?
  ['https://pennbook.app', 'https://www.pennbook.app', 'http://localhost']
  : ['https://localhost', 'http://localhost'];

app.use(cors({
  origin: CORS_POLICY,
}));

// Sentry Requests Hook
if (prod) {
  app.use(Sentry.Handlers.requestHandler());
}

app.use(express.json());

// Routing
app.use('/api', api);

// Setup error handling middleware
if (prod) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(returnError);

// Run the server
const server = app.listen(process.env.BACKEND_PORT);

const io = new Server(server, { cors: { origin: CORS_POLICY } });


io.on('connection', (socket) => {
  socket.on('connected', async ({ username }) => {
    await setOnlineStatus(username, true);
  },

  );
  socket.on('join', async ({ username, uuid }) => {
    try {
      await getChatInstance(username, uuid);
      socket.join(uuid);

      io.to(uuid).emit('message', { user: 'server', message: `Welcome to the chat, ${username}!` });
      io.to(uuid).emit('notification', { data: `${username} has joined the chat!` });

      redisClient.set(socket.id, username);
    } catch (err) {
      socket.emit('err', { message: 'You cannot join a chat you are not a part of!' });
    }
  });

  socket.on('message', async ({ message, username, uuid }) => {
    socket.to(uuid).emit('message', { user: username, message: message });
    try {
      await createChatMessage({ sender: username, message: message, chatUUID: uuid });
    } catch (err) {
      console.log('Failed to create chat message');
    }
  });

  socket.on('leave', async ({ username, uuid }) => {
    socket.leave(uuid);
    io.to(uuid).emit('message', {
      user: 'server',
      message: `User with username ${username} left!`,
    });
    try {
      await leaveChat(username, uuid);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on('disconnecting', async () => {
    const rooms = socket.rooms;
    const user = await redisClient.get(socket.id);
    for (const room of rooms) {
      io.to(room).emit('message', {
        user: 'server',
        message: `User with username ${user} disconnected!`,
      });
    }
  });

  socket.on('disconnect', async () => {
    const name = await redisClient.GETDEL(socket.id); // eslint-disable-line new-cap
    await setOnlineStatus(name, false);
  });
});

console.log(`Server running on port ${server.address().port}.`);
