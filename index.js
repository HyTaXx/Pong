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

        if (io.sockets.adapter.rooms.get(room).size === 1) {
            players.push({ id: socket.id, role: "left" });
            io.to(socket.id).emit("playerRole", "left");
        } else if (io.sockets.adapter.rooms.get(room).size === 2) {
            players.push({ id: socket.id, role: "right" });
            io.to(socket.id).emit("playerRole", "right");
            io.to(room).emit("gameStart", "Game started");
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
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
