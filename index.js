import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

/**
 * Initialize Express app.
 */
const app = express();

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Set up Socket.io server with CORS configuration.
 */
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

/**
 * An array to store active players.
 * @type {Array}
 */
let players = [];

/**
 * Handle socket connection event.
 */
io.on("connection", (socket) => {
  console.log("A user connected");

  /**
   * Handle 'joinGame' event.
   * @param {Object} data - The data containing player's name and room.
   */
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

  /**
   * Handle 'paddleMove' event and emit to the room.
   * @param {Object} data - The paddle movement data.
   */
  socket.on("paddleMove", (data) => {
    io.to(socket.room).emit("paddleMove", data);
  });

  /**
   * Handle socket disconnection event.
   */
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    players = players.filter((player) => player.id !== socket.id);
    console.log("Players: ", players);
  });

  /**
   * Handle 'playerName' event.
   * @param {string} name - The player's name.
   */
  socket.on("playerName", (name) => {
    console.log("Player name: ", name);
  });

  /**
   * Handle 'ballPosition' event and broadcast to others.
   * @param {Object} position - The ball's position data.
   */
  socket.on("ballPosition", (position) => {
    socket.broadcast.emit("ballPosition", position);
  });

  /**
   * Handle 'requestDisconnect' event.
   */
  socket.on("requestDisconnect", () => {
    console.log("Request to disconnect received");
    socket.broadcast.emit("otherPlayerDisconnected");
  });
});

/**
 * Start server and listen on a specified port.
 */
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
