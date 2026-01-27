// src/pages/DashboardDetailPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDashboardByIdApi, updateBoardApi } from '../../api/dashboard';
import { WS_URL } from '../../api/base';

type ObjectType = 'text' | 'image' | 'rectangle' | 'circle' | 'line';

interface BaseObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  lockedBy?: string;
}

interface TextObject extends BaseObject {
  type: 'text';
  content: string;
}

interface ImageObject extends BaseObject {
  type: 'image';
  url: string;
}

interface ShapeObject extends BaseObject {
  type: 'rectangle' | 'circle' | 'line';
  color: string;
}

type BoardObject = TextObject | ImageObject | ShapeObject;

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

export const DashboardDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('user123'); // В реальном приложении получать из токена
  const [ws, setWs] = useState<WebSocket | null>(null);
  const dragState = useRef<{
    type: 'move' | 'resize' | 'rotate' | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startRotation: number;
    startLeft: number;
    startTop: number;
  }>({ type: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startRotation: 0, startLeft: 0, startTop: 0 });

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (!id) return;

    // Получаем ID текущего пользователя из токена
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return null;
    }

    // В реальном приложении нужно расшифровать токен, чтобы получить ID пользователя
    // Для простоты сейчас используем фиктивный ID, но в продакшене нужно декодировать JWT
    // Пример декодирования JWT: const payload = JSON.parse(atob(token.split('.')[1]));
    // setCurrentUser(payload.userId);
    setCurrentUser('current_user_id');

    // Загружаем доску
    const loadDashboard = async () => {
      try {
        if (id) {
          const dashboard = await getDashboardByIdApi(id);
          setObjects(dashboard.objects || []);
        }
      } catch (err) {
        setError('Не удалось загрузить доску');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    // Подключаемся к WebSocket после загрузки доски
    const wsUrl = `${WS_URL}/ws?userId=${currentUser}&dashboardId=${id}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    // Отправляем сообщение о присоединении
    return () => {
      websocket.close();
    };
  }, [id, navigate, currentUser]);

  // Обработка сообщений от WebSocket
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'boardUpdate':
        setObjects(message.objects);
        break;
      case 'objectFocus':
        setObjects(prev =>
          prev.map(obj =>
            obj.id === message.objectId ? { ...obj, lockedBy: message.userId } : obj
          )
        );
        break;
      case 'objectBlur':
        setObjects(prev =>
          prev.map(obj =>
            obj.id === message.objectId ? { ...obj, lockedBy: undefined } : obj
          )
        );
        break;
      default:
        break;
    }
  };

  // Отправка сообщения через WebSocket
  const sendWebSocketMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  // Отправка обновления доски на сервер
  const sendBoardUpdate = async (updatedObjects: BoardObject[]) => {
    if (!id) return;

    try {
      await updateBoardApi({ id, objects: updatedObjects });
    } catch (error) {
      console.error('Failed to update board:', error);
    }
  };

  const addObject = (type: ObjectType) => {
    const id = `obj-${Date.now()}`;
    let obj: BoardObject;

    switch (type) {
      case 'text':
        obj = { id, type, x: 100, y: 100, width: 120, height: 30, rotation: 0, content: 'Текст' };
        break;
      case 'image':
        obj = { id, type, x: 200, y: 200, width: 200, height: 150, rotation: 0, url: 'https://via.placeholder.com/200x150?text=Img' };
        break;
      case 'rectangle':
        obj = { id, type, x: 300, y: 100, width: 100, height: 80, rotation: 0, color: '#3b82f6' };
        break;
      case 'circle':
        obj = { id, type, x: 400, y: 200, width: 80, height: 80, rotation: 0, color: '#ef4444' };
        break;
      case 'line':
        obj = { id, type, x: 500, y: 100, width: 150, height: 2, rotation: 0, color: '#10b981' };
        break;
      default:
        return;
    }

    const newObjects = [...objects, obj];
    setObjects(newObjects);

    // Отправляем обновление через WebSocket
    sendWebSocketMessage({
      type: 'boardUpdate',
      objects: newObjects,
      userId: currentUser
    });

    // Отправляем на сервер
    sendBoardUpdate(newObjects);
  };

  const handleCanvasClick = () => {
    setSelectedId(null);
  };

  const updateObject = (id: string, updates: Partial<BoardObject>) => {
    setObjects(prev =>
      prev.map(obj =>
        obj.id === id
          ? {
            ...obj,
            ...updates,
            x: Math.max(0, Math.min(CANVAS_WIDTH - (updates.width ?? obj.width), updates.x ?? obj.x)),
            y: Math.max(0, Math.min(CANVAS_HEIGHT - (updates.height ?? obj.height), updates.y ?? obj.y)),
          }
          : obj
      )
    );
  };

  const handleTextDoubleClick = (id: string) => {
    const obj = objects.find(o => o.id === id) as TextObject | undefined;
    if (obj && !obj.lockedBy) {
      const newContent = prompt('Редактировать текст:', obj.content);
      if (newContent !== null) {
        const updatedObjects = objects.map(obj =>
          obj.id === id ? { ...obj, content: newContent } : obj
        );
        setObjects(updatedObjects);

        // Отправляем обновление через WebSocket
        sendWebSocketMessage({
          type: 'boardUpdate',
          objects: updatedObjects,
          userId: currentUser
        });

        // Отправляем на сервер
        sendBoardUpdate(updatedObjects);
      }
    }
  };

  const handleMoveStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = objects.find(o => o.id === id);
    if (!obj || obj.lockedBy) return;

    // Отправляем сообщение о фокусе на объекте
    const updatedObjects = objects.map(obj =>
      obj.id === id ? { ...obj, lockedBy: currentUser } : obj
    );
    setObjects(updatedObjects);

    sendWebSocketMessage({
      type: 'objectFocus',
      objectId: id,
      userId: currentUser
    });

    dragState.current = {
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      startLeft: obj.x,
      startTop: obj.y,
      startWidth: 0,
      startHeight: 0,
      startRotation: 0,
    };
    setSelectedId(id);
  };

  const handleResizeStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = objects.find(o => o.id === id);
    if (!obj || obj.lockedBy) return;

    // Отправляем сообщение о фокусе на объекте
    const updatedObjects = objects.map(obj =>
      obj.id === id ? { ...obj, lockedBy: currentUser } : obj
    );
    setObjects(updatedObjects);

    sendWebSocketMessage({
      type: 'objectFocus',
      objectId: id,
      userId: currentUser
    });

    dragState.current = {
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      startWidth: obj.width,
      startHeight: obj.height,
      startLeft: obj.x,
      startTop: obj.y,
      startRotation: 0,
    };
    setSelectedId(id);
  };

  const handleRotateStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = objects.find(o => o.id === id);
    if (!obj || obj.lockedBy) return;

    // Отправляем сообщение о фокусе на объекте
    const updatedObjects = objects.map(obj =>
      obj.id === id ? { ...obj, lockedBy: currentUser } : obj
    );
    setObjects(updatedObjects);

    sendWebSocketMessage({
      type: 'objectFocus',
      objectId: id,
      userId: currentUser
    });

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    dragState.current = {
      type: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      startRotation: obj.rotation,
      startWidth: 0,
      startHeight: 0,
      startLeft: centerX,
      startTop: centerY,
    };
    setSelectedId(id);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!dragState.current.type || !selectedId) return;

    const obj = objects.find(o => o.id === selectedId);
    if (!obj) return;

    if (dragState.current.type === 'move') {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      const newX = Math.max(0, Math.min(CANVAS_WIDTH - obj.width, dragState.current.startLeft + dx));
      const newY = Math.max(0, Math.min(CANVAS_HEIGHT - obj.height, dragState.current.startTop + dy));

      updateObject(selectedId, {
        x: newX,
        y: newY,
      });
    }

    if (dragState.current.type === 'resize') {
      let dw = e.clientX - dragState.current.startX;
      let dh = e.clientY - dragState.current.startY;

      let newW = Math.max(20, dragState.current.startWidth + dw);
      let newH = Math.max(20, dragState.current.startHeight + dh);

      // Сохраняем соотношение сторон для изображений
      if (obj.type === 'image') {
        const aspect = dragState.current.startWidth / dragState.current.startHeight;
        newH = newW / aspect;
      }

      // Ограничиваем размеры в пределах холста
      newW = Math.min(newW, CANVAS_WIDTH - obj.x);
      newH = Math.min(newH, CANVAS_HEIGHT - obj.y);

      updateObject(selectedId, {
        width: newW,
        height: newH,
      });
    }

    if (dragState.current.type === 'rotate') {
      const angle = Math.atan2(
        e.clientY - dragState.current.startTop,
        e.clientX - dragState.current.startLeft
      ) * (180 / Math.PI);
      const rotation = (angle - dragState.current.startRotation) % 360;
      updateObject(selectedId, { rotation });
    }
  };

  const handleDragEnd = () => {
    if (selectedId) {
      // Отправляем обновление через WebSocket
      sendWebSocketMessage({
        type: 'boardUpdate',
        objects: objects,
        userId: currentUser
      });

      // Отправляем на сервер
      sendBoardUpdate(objects);

      // Отправляем сообщение о снятии фокуса
      sendWebSocketMessage({
        type: 'objectBlur',
        objectId: selectedId,
        userId: currentUser
      });
    }

    dragState.current.type = null;
  };

  useEffect(() => {
    if (dragState.current.type) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [selectedId, dragState.current.type, objects]);

  if (loading) {
    return <div>Загрузка доски...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Доска</h2>

      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => addObject('text')}>Текст</button>
        <button onClick={() => addObject('image')}>Изображение</button>
        <button onClick={() => addObject('rectangle')}>Прямоугольник</button>
        <button onClick={() => addObject('circle')}>Круг</button>
        <button onClick={() => addObject('line')}>Линия</button>
      </div>

      <div
        style={{
          position: 'relative',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          border: '2px solid #333',
          background: '#f9fafb',
          cursor: 'default',
        }}
        onClick={handleCanvasClick}
      >
        {objects.map(obj => {
          const isSelected = obj.id === selectedId;
          const isLocked = !!obj.lockedBy;

          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left: obj.x,
                top: obj.y,
                width: obj.width,
                height: obj.height,
                transform: `rotate(${obj.rotation}deg)`,
                transformOrigin: 'center',
                border: isLocked
                  ? '2px dashed red'
                  : isSelected
                    ? '2px solid blue'
                    : 'none',
                cursor: isLocked ? 'not-allowed' : 'move',
                userSelect: 'none',
              }}
              onMouseDown={e => handleMoveStart(obj.id, e)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={
                obj.type === 'text'
                  ? () => handleTextDoubleClick(obj.id)
                  : undefined
              }
            >
              {obj.type === 'text' ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#000',
                  }}
                >
                  {obj.content}
                </div>
              ) : obj.type === 'image' ? (
                <img
                  src={obj.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: (obj as ShapeObject).color,
                    borderRadius: obj.type === 'circle' ? '50%' : '0',
                  }}
                />
              )}

              {/* Индикатор редактора */}
              {isLocked && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    left: 0,
                    background: 'red',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {obj.lockedBy === currentUser ? 'Вы' : `Редактирует: ${obj.lockedBy}`}
                </div>
              )}

              {isSelected && !isLocked && (
                <>
                  {/* Ручка изменения размера */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      right: '-6px',
                      width: '12px',
                      height: '12px',
                      background: 'blue',
                      borderRadius: '50%',
                      cursor: 'nwse-resize',
                      border: '2px solid white',
                    }}
                    onMouseDown={e => handleResizeStart(obj.id, e)}
                  />

                  {/* Ручка вращения */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '10px',
                      height: '10px',
                      background: 'green',
                      borderRadius: '50%',
                      cursor: 'grab',
                      border: '2px solid white',
                    }}
                    onMouseDown={e => handleRotateStart(obj.id, e)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
        • Кликните на объект, чтобы выбрать<br />
        • Перетаскивайте объект, чтобы переместить<br />
        • Тяните за синюю точку — изменить размер<br />
        • Тяните за зелёную точку — повернуть<br />
        • Двойной клик на текст — редактировать<br />
        • Объект в фокусе другого пользователя нельзя редактировать
      </p>
    </div>
  );
};