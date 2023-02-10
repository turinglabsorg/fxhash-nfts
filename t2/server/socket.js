const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
app.get('/', (req, res) => {
  res.send("SOCKET_WORKS")
});

let sockets = []

io.on('connection', (socket) => {
  sockets.push(socket)
  socket.on("contribute", (arg, callback) => {
    try {
      io.emit("contribution", arg);
      callback("got it, thanks.");
    } catch (e) {
      console.log(e.message)
    }
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
