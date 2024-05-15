import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let players = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinGame", ({ name, room }) => {
    console.log(`${name} joined room ${room}`);
    socket.join(room);

    socket.room = room;

    if (io.sockets.adapter.rooms.get(room).size === 2) {
      console.log("Emitting gameStart event");
      io.to(room).emit("gameStart", "Game started");
      const clients = io.sockets.adapter.rooms.get(room);
      let players = Array.from(clients);
      io.to(players[0]).emit("playerRole", "left");
      io.to(players[1]).emit("playerRole", "right");
    }

    console.log("Players: ", players);
  });

  socket.on("paddleMove", (data) => {
    io.to(socket.room).emit("paddleMove", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    players = players.filter((player) => player.id !== socket.id);
    console.log("Players: ", players);
  });

  socket.on("playerName", (name) => {
    console.log("Player name: ", name);
  });

  socket.on("ballPosition", (position) => {
    socket.broadcast.emit("ballPosition", position);
  });

  socket.on("requestDisconnect", () => {
    console.log("Request to disconnect received");
    socket.broadcast.emit("otherPlayerDisconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
