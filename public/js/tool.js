// ========================== SOCKET SETUP ============================
const socket = io.connect();

const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room');
const userName = urlParams.get('name');

socket.emit("join-room", { roomName, userName });
console.log({ roomName, userName });

// ========================== BASIC SETUP ============================
const board = document.querySelector(".board");
const ctx = board.getContext("2d");

board.height = window.innerHeight;
board.width = window.innerWidth;

ctx.strokeStyle = "blue";
ctx.imageSmoothingEnabled = true;
ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.miterLimit = 1;
ctx.imageSmoothingQuality = "high";
ctx.lineWidth = 3;

let isMouseDown = false;
let interval = null;

// ========================== TOOL HANDLING ============================
let Activetool = "pencil";

const shapeOptions = document.querySelector(".tool-options.shape");
let currentShape = "rectangle";

function selectShapeType(type) {
    currentShape = type;
}

const pencilOptions = document.querySelector(".tool-options.pencil");
const eraserOptions = document.querySelector(".tool-options.eraser");
const tools = document.querySelectorAll(".tool");
const inputs = document.querySelectorAll("input[type=range]");
const ImageInput = document.querySelector(".upload-img");

function handleToolChange(tool) {
  if (tool === "pencil") {
    if (Activetool === "pencil") {
      pencilOptions.classList.add("show");
    } else {
      Activetool = "pencil";
      eraserOptions.classList.remove("show");
      tools[1].classList.remove("active");
      tools[0].classList.add("active");
      ctx.strokeStyle = "blue";
      ctx.lineWidth = inputs[0].value;
      ctx.globalCompositeOperation = "source-over";
    }
  } else if (tool === "eraser") {
    if (Activetool === "eraser") {
      eraserOptions.classList.add("show");
    } else {
      Activetool = "eraser";
      tools[0].classList.remove("active");
      tools[1].classList.add("active");
      pencilOptions.classList.remove("show");
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = inputs[0].value;
    }
  } else if (tool === "sticky") {
    createSticky();
  }

}
// ========================== DRAW EVENTS ============================
board.addEventListener("mousedown", (e) => {
  const top = getLocation();
  const x = e.clientX;
  const y = e.clientY - top;

  ctx.beginPath();
  ctx.moveTo(x, y);
  isMouseDown = true;

  const point = { x, y, identifier: "mousedown", color: ctx.strokeStyle, width: ctx.lineWidth };
  undoStack.push(point);
  socket.emit("mousedown", { point, roomName });
});

board.addEventListener("mousemove", (e) => {
  if (!isMouseDown) return;

  const top = getLocation();
  const x = e.clientX;
  const y = e.clientY - top;

  ctx.lineTo(x, y);
  ctx.stroke();

  const point = { x, y, identifier: "mousemove", color: ctx.strokeStyle, width: ctx.lineWidth };
  undoStack.push(point);
  socket.emit("mousemove", { point, roomName });
});

board.addEventListener("mouseup", () => {
  isMouseDown = false;
});

// ========================== UNDO / REDO ============================
let undoStack = [];
let redoStack = [];

function undoMaker() {
  if (undoStack.length > 0) {
    redoStack.push(undoStack.pop());
    redraw();
    return true;
  }
  return false;
}

function redoMaker() {
  if (redoStack.length > 0) {
    undoStack.push(redoStack.pop());
    redraw();
    return true;
  }
  return false;
}

const undo = document.querySelector(".undo");
const redo = document.querySelector(".redo");

undo.addEventListener("mousedown", () => {
  interval = setInterval(() => {
    if (undoMaker()) socket.emit("undo", { roomName });
  }, 50);
});
undo.addEventListener("mouseup", () => clearInterval(interval));

redo.addEventListener("mousedown", () => {
  interval = setInterval(() => {
    if (redoMaker()) socket.emit("redo", { roomName });
  }, 50);
});
redo.addEventListener("mouseup", () => clearInterval(interval));

// ========================== TOOL & COLOR ============================
function sizeChange(value) {
  ctx.lineWidth = value;
  socket.emit("size", { value, roomName });
}

function handleLocaltoolChange(tool) {
  handleToolChange(tool);
  if (tool !== "sticky") {
    socket.emit("toolchange", { tool, roomName });
  }
}

function handleColorChange(color) {
  ctx.strokeStyle = color;
  socket.emit("color", { color, roomName });
}

// ========================== CLEAR / REDRAW ============================
function clearWhiteboard(local = true) {
  ctx.clearRect(0, 0, board.width, board.height);
  if (local) socket.emit("clear-board", { roomName });
}

function redraw() {
  ctx.clearRect(0, 0, board.width, board.height);
  for (const { x, y, identifier, color, width } of undoStack) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (identifier === "mousedown") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (identifier === "mousemove") {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}

function getLocation() {
  return board.getBoundingClientRect().top;
}

// ========================== SOCKET LISTENERS ============================
socket.on("clear-board", () => clearWhiteboard(false));
socket.on("onsize", (size) => (ctx.lineWidth = size));
socket.on("oncolor", (color) => (ctx.strokeStyle = color));
socket.on("ontoolchange", (tool) => handleToolChange(tool));
socket.on("onhamburger", () => handleHamburger());
socket.on("onmousedown", ({ x, y, color, width }) => {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  undoStack.push({ x, y, identifier: "mousedown", color, width });
});
socket.on("onmousemove", ({ x, y, color, width }) => {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineTo(x, y);
  ctx.stroke();
  undoStack.push({ x, y, identifier: "mousemove", color, width });
});
socket.on("onundo", () => undoMaker());
socket.on("onredo", () => redoMaker());

// ========================== LEAVE ROOM ============================
document.getElementById("leave-room-btn").addEventListener("click", () => {
  socket.emit("disconnet", { roomName, userName });
  alert("You have left the room.");
  window.location.href = "/";
});

// ========================== CHAT ============================
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (msg.length > 0) {
    socket.emit("chat-message", { username: userName, message: msg });
    appendMessage(`You (You): ${msg}`, true);
    chatInput.value = "";
  }
});

socket.on("chat-message", ({ username, message }) => {
  appendMessage(`${username}: ${message}`);
});

function appendMessage(message, self = false) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = message;
  msgDiv.style.margin = "0.5rem 0";
  msgDiv.style.textAlign = self ? "right" : "left";
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========================== DOWNLOAD BOARD ============================
document.querySelector(".download-tool").addEventListener("click", () => {
  const imageURL = board.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageURL;
  link.download = "whiteboard.png";
  link.click();
});

// ========================== USERS LIST ============================
const usersList = document.getElementById("users-list");

socket.on("room-users", (users) => {
  usersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    usersList.appendChild(li);
  });
});


