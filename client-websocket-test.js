const { io } = require("socket.io-client");

const socket = io("http://localhost:3010/ws/traffic/traffic-session-12345", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("startTest", {
    interface: "enp70s0",
    protocol: "tcp",
    duration: 10,
    captureLimit: 5000
  });
});

socket.on("startTestResponse", (data) => {
  console.log("Start response:", data);
});

socket.on("trafficUpdate", (msg) => {
  console.log("FLOW_UPDATE:", JSON.stringify(msg, null, 2));
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});