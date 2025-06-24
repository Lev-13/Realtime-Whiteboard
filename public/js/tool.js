// connect to socket server

const socket = io.connect();

const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room');
const userName = urlParams.get('name');

socket.emit("join-room", {roomName , userName});

console.log( { roomName , userName} ) ;

// *********************************Basic Setup
const board = document.querySelector(".board");
board.height = window.innerHeight;
board.width = window.innerWidth;
// canvasRenderingContext2d=> tool
const ctx = board.getContext("2d");
ctx.strokeStyle = "blue";
ctx.imageSmoothingEnabled = true;
ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.miterLimit = 1;
ctx.imageSmoothingQuality = "high";
ctx.lineWidth = 3;

// ************************Change Size**************************//
function sizeChange(value) {
  ctx.lineWidth = value;
  socket.emit("size", {value , roomName} );
}

// **tool Change***************************************************//
function handleLocaltoolChange(tool) {
  handleToolChange(tool);
  if (tool != "sticky");
  socket.emit("toolchange", {tool, roomName});
}
// ******************handle color****************************
function handleColorChange(color) {
  ctx.strokeStyle = color;
  socket.emit("color", {color , roomName});
}

const hamburger = document.querySelector(".hamburger");
const toolPanel = document.querySelector(".tool-panel");
hamburger.addEventListener("click", function () {
  handleHamburger()

  socket.emit("hamburger" , { roomName});
});

socket.on('clear-board', () => {
    clearWhiteboard();
});


    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

  const username = userName ;

    chatForm.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent default form submission
        const msg = chatInput.value.trim();
        if (msg.length > 0) {
            socket.emit('chat-message', {
                username: username,
                message: msg
            });
            appendMessage(`You (You): ${msg}`, true);
            chatInput.value = '';
        }
    });

    socket.on('chat-message', function (data) {
        appendMessage(`${data.username}: ${data.message}`);
    });

    function appendMessage(message, self = false) {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.margin = "0.5rem 0";
        msgDiv.style.textAlign = self ? "right" : "left";
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    document.querySelector('.download-tool').addEventListener('click', function () {
    const canvas = document.getElementById('board');
    if (!canvas) {
        console.error("Canvas with id 'board' not found.");
        return;
    }

    const imageURL = canvas.toDataURL('image/png'); // Get base64 image URL
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = 'whiteboard.png'; // file name
    link.click(); // Trigger download
});

const usersList = document.getElementById('users-list');

socket.on('room-users', (users) => {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    usersList.appendChild(li);
  });
});


