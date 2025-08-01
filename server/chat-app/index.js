import https from "https";
import http from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
dotenv.config()
import fs from 'fs';
import express from 'express';

const app = express();


const production = process.env.NODE_ENV == 'production'
const sslKey = production ? fs.readFileSync(process.env.SSL_KEY, 'utf8') : ''
const sslCert = production ? fs.readFileSync(process.env.SSL_CERT, 'utf8') : ''

let httpServer

if (production)
	httpServer = https.createServer({
		key: sslKey,
		cert: sslCert,
	}, app);
else
	httpServer = http.createServer(app);

const io = new Server(httpServer, {
	cors: {
		origin: "*",
	}
});

// Map of userId (socket.id) to last ping timestamp
let userLastPing = {};
// Map of userId to timestamp when they went AFK
let afkUsers = {};

io.on("connection", (socket) => {
	console.log(`New client connected: ${socket.id}`);
	userLastPing[socket.id] = Date.now();
	// Remove from AFK if they were there
	delete afkUsers[socket.id];
	io.emit("online-users", { action: "connect", userId: socket.id, onlineUsers: Object.keys(userLastPing).length, afkUsers: Object.keys(afkUsers).length });
	
	
	socket.on("ping", (data) => {
		const now = Date.now();

		userLastPing[socket.id] = now;
		// Remove from AFK if they were there (user is back)
		if (afkUsers[socket.id]) {
			delete afkUsers[socket.id];
			io.emit("online-users", { action: "back", userId: socket.id, onlineUsers: Object.keys(userLastPing).length, afkUsers: Object.keys(afkUsers).length });
		}
		
		// Remove users who haven't pinged in the last 8 seconds (move to AFK)
		for (const [id, last] of Object.entries(userLastPing)) {
			if (now - last > 9000) {
				delete userLastPing[id];
				afkUsers[id] = now; // Record when they went AFK
				console.log("Moving user to AFK:", id);
				io.emit("online-users", { action: "afk", userId: id, onlineUsers: Object.keys(userLastPing).length, afkUsers: Object.keys(afkUsers).length });
			}
		}
		
		// Remove AFK users who have been inactive for more than 1 minute (60000ms)
		for (const [id, afkTime] of Object.entries(afkUsers)) {
			if (now - afkTime > 60000) {
				delete afkUsers[id];
				console.log("Removing AFK user after 1 minute:", id);
				io.emit("online-users", { action: "remove", userId: id, onlineUsers: Object.keys(userLastPing).length, afkUsers: Object.keys(afkUsers).length });
			}
		}
		
		console.log(`Ping received from ${socket.id}.`);
		
		// Broadcast current user count
		socket.emit("pong", { now, onlineUsers: Object.keys(userLastPing).length, afkUsers: Object.keys(afkUsers).length });
	});

	socket.on("latency-ping", ({ now, userId }) => {
		const latency = Math.ceil((Date.now() - new Date(now))/2);
		console.log(`Latency ping from ${userId}: ${latency}ms`);
		socket.emit("latency-pong", { latency });
	});
	
	socket.on("message", (message) => {
		console.log(`Message received: ${JSON.stringify(message)}`);
		io.emit("message", message);
	});
	
	socket.on("disconnect", () => {
		console.log(`Client disconnected: ${socket.id}`);
		delete userLastPing[socket.id];
		delete afkUsers[socket.id];
		io.emit("online-users", { action: "disconnect", userId: socket.id, onlineUsers: Object.keys(userLastPing).length, afkUsers: Object.keys(afkUsers).length });
	});
});

httpServer.listen(5001);