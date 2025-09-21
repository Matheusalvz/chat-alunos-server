const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // permite Angular conectar de qualquer lugar
});

const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // registra o usuário em uma sala com seu próprio ID
  socket.on('register', (userId) => {
    socket.userId = userId;
    socket.join(userId);
    console.log(`Usuário ${userId} entrou na sala`);
  });

  // envia mensagem para outro usuário
//   socket.on('message', (data) => {
//     // data = { to: userId, message: 'texto' }
//     io.to(data.to).emit('message', { from: socket.userId, message: data.message });
//   });

  socket.on('private-message', (data) => {
    const targetSocket = connectedUsers[data.to]; // mapeamento userId → socketId
    if (targetSocket) {
      io.to(targetSocket).emit('message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectou:', socket.id);
  });
});

server.listen(3000, () => console.log('Socket.IO server running on port 3000'));