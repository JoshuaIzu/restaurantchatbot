import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(sessionId: string): Socket {
    if (socket?.connected) return socket

    socket = io(import.meta.env.VITE_API_BASE_URL || '/', {
        query: { sessionId },
        transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => console.log('Socket connected:', socket?.id))
    socket.on('disconnect', () => console.log('Socket disconnected'))

    return socket;
}

export function reconnectSocket(sessionId: string): Socket {
    if (socket?.connected) {
        socket.disconnect()
        socket = null
    }

    socket = io(import.meta.env.VITE_API_BASE_URL || '/', {
        query: { sessionId },
        transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => console.log('Socket reconnected:', socket?.id, 'with sessionId:', sessionId))
    socket.on('disconnect', () => console.log('Socket disconnected'))

    return socket;
}

export function getSocket(): Socket | null {
  return socket
}
export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}