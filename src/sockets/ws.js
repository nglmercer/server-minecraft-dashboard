// WebSocketManager.js
import { WebSocket } from 'ws'; // Used for WebSocket.OPEN constant

class WebSocketManager {
  constructor(fastifyInstance, routePath = '/ws') {
    if (!fastifyInstance) {
      throw new Error('Fastify instance is required for WebSocketManager.');
    }
    this.fastify = fastifyInstance;
    this.routePath = routePath;
    // It's generally not necessary to store `wss` (the server) here
    // if you're primarily using `fastify.websocketServer` for broadcasting.
  }

  init() {
    // No need to access this.fastify.websocketServer here if only used in broadcast
    // It will be accessed directly there.

    this.fastify.get(this.routePath, { websocket: true }, (connection, req) => {
      // `connection` is a SocketStream (a Duplex stream)
      // `connection.socket` is the actual 'ws.WebSocket' instance for this client

      // --- START DEBUG LOGGING ---
      console.log('[WebSocketManager] Connection handler invoked.');
      if (!connection) {
        console.error('[WebSocketManager] CRITICAL: "connection" object is undefined or null.');
        return; // Cannot proceed
      }
      console.log(`[WebSocketManager] "connection" object type: ${typeof connection}`);
      
      if (typeof connection.socket === 'undefined') {
        console.error('[WebSocketManager] CRITICAL: "connection.socket" is undefined.');
        console.log('[WebSocketManager] Properties of "connection" object:');
        for (const prop in connection) {
          // Avoid logging very large or complex objects if 'connection' is a stream
          if (Object.prototype.hasOwnProperty.call(connection, prop)) {
            const value = connection[prop];
            if (typeof value !== 'object' || value === null) {
                 console.log(`  - ${prop}: ${value} (type: ${typeof value})`);
            } else {
                 console.log(`  - ${prop}: (type: ${typeof value}, constructor: ${value.constructor ? value.constructor.name : 'N/A'})`);
            }
          }
        }
        // If connection.socket is undefined, we cannot proceed with clientWs.
        // It's possible 'connection' itself is the WebSocket object in some older/different setup.
        // If 'connection' has a 'send' method, that might be it.
        if (typeof connection.send === 'function' && typeof connection.on === 'function') {
            console.warn('[WebSocketManager] "connection" object itself looks like a WebSocket. Attempting to use it directly. This might indicate an API mismatch or older plugin version.');
            // Fallback: const clientWs = connection; // Not standard for @fastify/websocket
        } else {
            // End the stream if possible, as we can't get the WebSocket instance
            if (typeof connection.destroy === 'function') connection.destroy();
            else if (typeof connection.end === 'function') connection.end();
            return;
        }
      }
      // --- END DEBUG LOGGING ---

      const clientWs = connection.socket;

      // Additional check, though the error implies clientWs was undefined, not just not open
      if (!clientWs) {
        console.error('[WebSocketManager] CRITICAL: clientWs (derived from connection.socket) is still undefined after checks. Aborting for this connection.');
        if (typeof connection.destroy === 'function') connection.destroy();
        else if (typeof connection.end === 'function') connection.end();
        return;
      }

      console.log(`[WebSocketManager] Client connected to ${this.routePath}. Initial readyState: ${clientWs.readyState}`);

      // Ensure the socket is open before sending, or queue the send.
      // The handler is usually called when it's open, but this is safer.
      const welcomeMessage = `Connected to ${this.routePath}`;
      if (clientWs.readyState === WebSocket.OPEN) {
        console.log('[WebSocketManager] Socket OPEN, sending welcome message.');
        clientWs.send(welcomeMessage);
      } else {
        console.warn(`[WebSocketManager] Socket not OPEN (state: ${clientWs.readyState}). Waiting for 'open' event to send welcome message.`);
        clientWs.once('open', () => {
          console.log('[WebSocketManager] Socket now OPEN, sending welcome message.');
          clientWs.send(welcomeMessage);
        });
      }

      clientWs.on('message', (message) => {
        console.log(`[WebSocketManager] Received from client on ${this.routePath}: ${message.toString()}`);
        // Example: Echo message back to the sender
        // if (clientWs.readyState === WebSocket.OPEN) clientWs.send(`Echo: ${message.toString()}`);
      });

      clientWs.on('close', (code, reason) => {
        const reasonString = reason ? reason.toString() : 'No reason given';
        console.log(`[WebSocketManager] Client disconnected from ${this.routePath}. Code: ${code}, Reason: ${reasonString}`);
      });

      clientWs.on('error', (error) => {
        console.error(`[WebSocketManager] WebSocket error for client on ${this.routePath}:`, error);
      });
    });

    const fullRoutePath = `${this.fastify.prefix || ''}${this.routePath}`;
    console.log(`[WebSocketManager] WebSocket route initialized at ${fullRoutePath}`);
  }

  broadcast(data, excludeClient = null) {
    if (!this.fastify.websocketServer || !this.fastify.websocketServer.clients) {
      console.error('[WebSocketManager] WebSocketServer or clients set not available for broadcast. Ensure fastify-websocket is registered correctly with clientTracking enabled.');
      return;
    }

    let messageToSend;
    if (Buffer.isBuffer(data) || typeof data === 'string' || data instanceof ArrayBuffer) {
        messageToSend = data;
    } else if (Array.isArray(data) && data.every(item => Buffer.isBuffer(item))) {
        messageToSend = data;
    } else {
        try {
            messageToSend = JSON.stringify(data);
        } catch (e) {
            console.error("[WebSocketManager] Failed to stringify data for broadcast:", e);
            messageToSend = String(data);
        }
    }

    let successCount = 0;
    this.fastify.websocketServer.clients.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageToSend);
          successCount++;
        } catch (error) {
          console.error('[WebSocketManager] Error sending message to a client during broadcast:', error);
        }
      }
    });
    if (this.fastify.websocketServer.clients.size > 0) {
        // console.log(`[WebSocketManager] Broadcasted message to ${successCount}/${this.fastify.websocketServer.clients.size} eligible clients.`);
    }
  }

  getClientCount() {
    if (this.fastify.websocketServer && this.fastify.websocketServer.clients) {
      return this.fastify.websocketServer.clients.size;
    }
    return 0;
  }
}

export default WebSocketManager;