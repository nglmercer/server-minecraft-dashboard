// config.js
export const P2P_SERVICE_TYPE = 'mi-app-com';
export const P2P_SERVICE_PROTOCOL = 'tcp';
export const P2P_INSTANCE_NAME_PREFIX = 'MiNodoApp_';
export const P2P_MESSAGE_DELIMITER = '\n';

// Podrías añadir configuraciones de Fastify aquí también si lo deseas
export const API_PORT = process.env.PORT || 3000;
export const API_HOST = '0.0.0.0';