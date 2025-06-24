socket.on("onsize", function(size) {
  ctx.lineWidth = size;
});
socket.on("oncolor", function(color) {
  ctx.strokeStyle = color;
});
socket.on("ontoolchange", function(tool) {
  handleToolChange(tool);
});
socket.on("onhamburger", function() {
  handleHamburger();
});
socket.on("onmousedown", function(point) {
  const { x, y, color, width } = point;
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  undoStack.push(point);
});
socket.on("onmousemove", function(point) {
  const { x, y, color, width } = point;
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineTo(x, y);
  ctx.stroke();
  undoStack.push(point);
});
socket.on("onundo", function() {
  undoMaker();
});
socket.on("onredo", function() {
  redoMaker();
});






document.getElementById("leave-room-btn").addEventListener("click", () => {
  socket.emit("disconnet", {roomName , userName});
  alert("You have left the room.");
  window.location.href = "/"; // redirect to home or landing page
});




