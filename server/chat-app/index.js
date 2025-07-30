const express = require('express')
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('don\'t poke around.');
});

app.listen(5000, () => {
    console.log('Chat App server is running on port 5001');
});

const io = new Server();

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);
});

io.listen(5001);