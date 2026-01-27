import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { IncomingMessage } from 'http';

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  dashboardId: string;
}

// Хранилище активных соединений
const activeConnections = new Map<string, ClientInfo>();

export default async function websocketPlugin(fastify: FastifyInstance) {
  // Инициализируем WebSocket сервер
  const wss = new WebSocket.Server({ noServer: true });

  // Обработка апгрейда HTTP-соединения до WebSocket
  // Устанавливаем обработчик один раз после готовности сервера
  const upgradeHandler = (request: IncomingMessage, socket, head) => {
    // Проверяем, что это запрос к WebSocket эндпоинту
    if (request.url?.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  };

  fastify.addHook('onReady', () => {
    fastify.server.on('upgrade', upgradeHandler);
  });

  // Обработка новых WebSocket соединений
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('New WebSocket connection');

    // Парсим параметры из URL
    const urlParams = new URLSearchParams(req.url?.split('?')[1]);
    const userId = urlParams.get('userId');
    const dashboardId = urlParams.get('dashboardId');

    if (!userId || !dashboardId) {
      ws.close(1008, 'Missing userId or dashboardId');
      return;
    }

    // Сохраняем информацию о клиенте
    const clientId = `${userId}:${dashboardId}`;
    activeConnections.set(clientId, { ws, userId, dashboardId });

    // Отправляем сообщение о присоединении
    const joinMessage = {
      type: 'userJoined',
      userId,
      dashboardId,
      timestamp: Date.now(),
    };
    broadcastToDashboard(dashboardId, joinMessage, ws);

    // Обработка входящих сообщений
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());

        // Валидация типа сообщения
        if (!isValidMessageType(message.type)) {
          return;
        }

        // Добавляем информацию о пользователе
        message.userId = userId;
        message.timestamp = Date.now();

        // Рассылаем сообщение всем участникам доски
        broadcastToDashboard(dashboardId, message, ws);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Обработка закрытия соединения
    ws.on('close', (code, reason) => {
      console.log(`WebSocket closed: ${code} - ${reason}`);
      activeConnections.delete(clientId);

      // Уведомляем других участников о выходе пользователя
      const leaveMessage = {
        type: 'userLeft',
        userId,
        dashboardId,
        timestamp: Date.now(),
      };
      broadcastToDashboard(dashboardId, leaveMessage, ws);
    });

    // Обработка ошибок
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      activeConnections.delete(clientId);
    });
  });

  // Функция для отправки сообщений всем участникам доски
  function broadcastToDashboard(dashboardId: string, message: any, senderWs?: WebSocket) {
    for (const [clientId, clientInfo] of activeConnections.entries()) {
      if (clientInfo.dashboardId === dashboardId && clientInfo.ws !== senderWs && clientInfo.ws.readyState === WebSocket.OPEN) {
        try {
          clientInfo.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error sending message to client ${clientId}:`, error);
          // Удаляем проблемное соединение
          activeConnections.delete(clientId);
          clientInfo.ws.close();
        }
      }
    }
  }

  // Валидация типа сообщения
  function isValidMessageType(type: string): boolean {
    const validTypes = [
      'boardUpdate',      // Обновление доски
      'objectFocus',      // Фокус на объекте
      'objectBlur',       // Снятие фокуса с объекта
      'cursorPosition',   // Позиция курсора
      'userJoined',       // Присоединение пользователя
      'userLeft',         // Выход пользователя
    ];
    return validTypes.includes(type);
  }

  // Закрываем WebSocket сервер при завершении работы приложения
  fastify.addHook('onClose', (instance, done) => {
    fastify.server.off('upgrade', upgradeHandler); // Удаляем обработчик при закрытии
    wss.close(() => {
      console.log('WebSocket server closed');
      done();
    });
  });
}