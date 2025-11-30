// index.js
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";

import app from "./app.js";
import { setupWebSocket } from "./websocket.js";

dotenv.config();

const PORT = process.env.PORT || 5002;

// Tạo HTTP server cho WebSocket
const server = http.createServer(app);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    // Initialize and setup WebSocket server
    const wss = setupWebSocket(server);

    server.listen(PORT, () => {
      console.log(`Order Service is running on port ${PORT}`);
      console.log(
        `WebSocket server is running on ws://localhost:${PORT}/ws/orders/:id`
      );
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

export default server;
