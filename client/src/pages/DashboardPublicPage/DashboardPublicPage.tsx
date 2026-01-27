import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {type Dashboard, getPublicDashboardByHashApi} from "../../api/dashboard.ts";

export const DashboardPublicPage: React.FC = () => {
  const { publicHash } = useParams<{ publicHash: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicHash) {
      setError('Неверная ссылка: отсутствует hash');
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const data = await getPublicDashboardByHashApi(publicHash);
        setDashboard(data);
      } catch (err) {
        setError('Не удалось загрузить публичную панель');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [publicHash]);

  const handleEdit = () => {
    // В реальном приложении нужно проверить, есть ли у пользователя доступ к редактированию
    // и перенаправить на соответствующую страницу
    alert('Редактирование публичной доски возможно только для владельцев и приглашенных редакторов');
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  if (!dashboard) {
    return <div>Панель не найдена</div>;
  }

  return (
    <div className="dashboard-public" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{dashboard.title || 'Публичная панель'}</h1>
        <button
          onClick={handleEdit}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Редактировать
        </button>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1600px',
        height: '900px',
        border: '2px solid #333',
        background: '#f9fafb',
        overflow: 'auto'
      }}>
        {/* Render the dashboard content here */}
        <p style={{ textAlign: 'center', paddingTop: '400px', color: '#666' }}>
          Просмотр публичной доски. Авторизуйтесь и получите доступ к редактированию, если владелец дал вам права.
        </p>
      </div>
    </div>
  );
};