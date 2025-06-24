// server side
require('dotenv').config(); // 👈 must be at the top
const express = require("express");
// express server
const app = express();

const cors = require("cors");
//  nodejs
const { Server } = require("socket.io");

const server = require("http").Server(app); 
// nodejs => socket enabled
const path = require("path");


// serve static assets to client
app.use(cors({
  origin: "https://stalwart-youtiao-58b251.netlify.app",
  credentials: true
}));


app.use(express.json());                      // For JSON bodies
app.use(express.urlencoded({ extended: true })); // For form-encoded data

// ✅ Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));


const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));



const RoomSchema = new mongoose.Schema({
  name: String,
  users: [String], // array of usernames
});

const Room = mongoose.model('Room', RoomSchema);


const io = new Server(server, {
  cors: {
    origin: "https://stalwart-youtiao-58b251.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});


app.post("/room", (req, res) => {
  const roomName = req.body.room;
  const userName = req.body.name;

  if (!roomName || !userName) return res.redirect("/");

  // ✅ This line must point to room.html, not /room 

  console.log({ roomName , userName}) ;
  res.redirect(`/room.html?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(userName)}`);
});

  console.log("here1") ;

  async function sendRoomUsers(roomName) {
  try {
    const room = await Room.findOne({ name: roomName });
    if (room) {
      io.to(roomName).emit('room-users', room.users);
    }
  } catch (err) {
    console.error("Error fetching room users:", err);
  }
}




io.on("connection", function(socket) {

  
  // console.log("A client connected:", socket.id); 

  socket.on("join-room", async ({ roomName, userName }) => {
  console.log(`Joining room: ${roomName} by ${userName}`);
  socket.join(roomName);
  socket.to(roomName).emit('user-connected', userName);
  socket.to(roomName).emit('chat-message', {
            username: userName,
            message: `${userName} has joined the room.`
        });

  try {
    let room = await Room.findOne({ name: roomName });
    if (!room) {
      console.log(`Creating new room: ${roomName}`);
      room = new Room({ name: roomName, users: [userName] });
    } else {
      console.log(`Adding ${userName} to existing room: ${roomName}`);
      if (!room.users.includes(userName)) {
        room.users.push(userName);
      }
    }

    await room.save();
    await sendRoomUsers(roomName);

    console.log(`Room saved to DB: ${room.name}, users: ${room.users.join(', ')}`);

  } catch (err) {
    console.error('Error saving room to DB:', err);
  }

  socket.on("disconnect", async () => {
    console.log(`${userName} disconnected from ${roomName}`);
    if (userName && roomName) {
            socket.to(roomName).emit('chat-message', {
                username: userName,
                message: `${userName} has left the room.`
            });
        }
    try {
      const room = await Room.findOne({ name: roomName });
      if (room) {
        room.users = room.users.filter(u => u !== userName);
        if (room.users.length === 0) {
          await Room.deleteOne({ name: roomName });
          console.log(`Room ${roomName} deleted`);
        } else {
          await room.save();
          console.log(`Updated room ${roomName} after disconnect`);
        }
      }
    } catch (err) {
      console.error('Error updating room on disconnect:', err);
    }
      await sendRoomUsers(roomName);

  });
});

 socket.on('chat-message', (data) => {
        socket.broadcast.emit('chat-message', {
            username: data.username,
            message: data.message
        });
    });


socket.on("size", ({ size, roomName }) => {
  socket.to(roomName).emit("onsize", size);
});
socket.on('clear-board', ({ roomName }) => {
    socket.to(roomName).emit('clear-board');
});

socket.on("color", ({ color, roomName }) => {
  socket.to(roomName).emit("oncolor", color);
});

socket.on("toolchange", ({ tool, roomName }) => {
  socket.to(roomName).emit("ontoolchange", tool);
});

socket.on("hamburger", ({ roomName }) => {
  socket.to(roomName).emit("onhamburger");
});

socket.on("mousedown", ({ point, roomName }) => {
  socket.to(roomName).emit("onmousedown", point);
});

socket.on("mousemove", ({ point, roomName }) => {
  socket.to(roomName).emit("onmousemove", point);
});

socket.on("undo", ({ roomName }) => {
  socket.to(roomName).emit("onundo");
});

socket.on("redo", ({ roomName }) => {
  socket.to(roomName).emit("onredo");
});



});

// nodejs server

const port = process.env.PORT || 3000;


server.listen(port, () => {
  
  console.log(`✅ Server running on port ${port}`);


});
