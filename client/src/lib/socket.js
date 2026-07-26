import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000" : undefined);
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;
