/** Server entrypoint: HTTP API + static frontend + Socket.io (draft room arrives in Phase 2). */
import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app';
import { env } from './env';
import { prisma } from './lib/prisma';

const app = createApp();
const server = http.createServer(app);

// Socket.io is attached now so the deploy topology is final; handlers come in Phase 2.
export const io = new SocketServer(server, { path: '/socket.io' });

server.listen(env.port, () => {
  console.log(`Fantasy Politics server listening on :${env.port}`);
  if (env.adminEmails.length === 0) {
    console.warn('ADMIN_EMAILS is not set — nobody can open the admin panel.');
  }
});

async function shutdown() {
  io.close();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
