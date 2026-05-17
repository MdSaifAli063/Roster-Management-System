const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

let io = null;

function initRealtime(httpServer) {
  const origins = (process.env.CLIENT_URL || 'http://localhost:5000')
    .split(',')
    .map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? origins : true,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
    socket.join('all');

    socket.emit('connected', { userId: id, role });

    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  return io;
}

function emitToUser(userId, event, data) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, data);
}

function emitToUsers(userIds, event, data) {
  if (!io || !userIds?.length) return;
  userIds.forEach((id) => emitToUser(id, event, data));
}

function emitToRole(role, event, data) {
  if (!io || !role) return;
  io.to(`role:${role}`).emit(event, data);
}

function emitToStaff(event, data) {
  if (!io) return;
  ['ADMIN', 'HR_USER', 'TRAINING_MANAGER'].forEach((role) => emitToRole(role, event, data));
}

function broadcastAll(event, data) {
  if (!io) return;
  io.to('all').emit(event, data);
}

module.exports = {
  initRealtime,
  getIO,
  emitToUser,
  emitToUsers,
  emitToRole,
  emitToStaff,
  broadcastAll,
};
