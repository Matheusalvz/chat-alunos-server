const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: '*' } // Conexão de qualquer origem
// });
const io = new Server(server, {
    cors: {
      origin: "http://localhost:4200", // Conexão apenas pela porta 4200
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    }
  });

// Map de userId -> socket.id
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`Usuário conectado: socket.id=${socket.id}`);

  socket.onAny((event, ...args) => {
    console.log(`Evento recebido: ${event}`, args);
  });

  // registra o usuário e guarda no mapa
  socket.on('register', (userId) => {
    socket.userId = userId;
    connectedUsers[userId] = socket.id; // salva mapeamento
    socket.join(userId); // mantém sala por userId
    console.log(`Usuário registrado: userId=${userId}, socket.id=${socket.id}`);
    console.log('Usuarios conectados atualmente:', connectedUsers);
  });

  // envia mensagem privada
  socket.on('private-message', (data) => {
    const targetSocketId = connectedUsers[data.to];
    console.log(`Mensagem recebida do socket.id=${socket.id} (userId=${socket.userId}) para userId=${data.to}: "${data.message}"`);
    
    if (targetSocketId) {
      console.log(`Enviando para socket.id=${targetSocketId}`);
      io.to(targetSocketId).emit('private-message', {
        from: socket.userId,
        to: data.to,
        message: data.message,
        image: data.image
      });
    } else {
      console.log(`Usuário ${data.to} não conectado`);
    }
  });

  // socket.on('request-screenshot', (data) => {
  //   const targetSocketId = connectedUsers[data.to];
  //   if (targetSocketId) {
  //     console.log(`Pedido de screenshot de ${socket.userId} para ${data.to}`);
  //     // io.to(targetSocketId).emit('request-screenshot', { from: socket.userId });
  //     io.to(data.to).emit('request-screenshot', { from: socket.userId });
  //   } else {
  //     console.log(`Usuário ${data.to} não conectado`);
  //   }
  // });
  socket.on('request-screenshot', (data) => {
    const targetSocketId = connectedUsers[data.to];
    if (targetSocketId) {
      console.log(`Pedido de screenshot de ${socket.userId} para ${data.to}`);
      io.to(targetSocketId).emit('request-screenshot', { from: socket.userId });
    } else {
      console.log(`Usuário ${data.to} não conectado`);
    }
  });

  // socket.on('screen-shot', ({ to, from, dataUrl }) => {
  //   console.log(`screenshot recebido de ${from} para ${to}`);
  //   io.to(to).emit('screen-shot', { from, dataUrl });
  // });

  socket.on('screen-shot', ({ to, from, dataUrl }) => {
    console.log(`screenshot recebido de ${from} para ${to}`);
    const targetSocketId = connectedUsers[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('screen-shot', { from, dataUrl });
    } else {
      console.log(`Usuário ${to} não conectado`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectou: socket.id=${socket.id}, userId=${socket.userId}`);
    // remove do mapa
    if (socket.userId) {
      delete connectedUsers[socket.userId];
    }
    console.log('Usuarios conectados atualmente:', connectedUsers);
  });
});

server.listen(3000, () => console.log('Socket.IO server running on port 3000'));