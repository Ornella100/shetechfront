import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket;

// Connexion unique, authentifiée par le JWT courant — utilisée par le widget de
// messagerie pour recevoir les messages directs et projet en temps réel.
export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem("token");
  if (!token) return null;
  socket = io(BASE_URL, { auth: { token }, autoConnect: true });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = undefined;
}
