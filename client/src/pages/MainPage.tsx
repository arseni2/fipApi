// src/pages/MainPage.tsx
import React, { useEffect, useState } from 'react';
import { DashboardCard } from '../components/DashboardCard';
import { DashboardCreate } from '../components/DashboardCreate';
import {getPublicDashboardsApi, likeDashboardApi, makePublicApi} from '../api/dashboard';
import {EditableDashboard} from "../components/EditableDashboard.tsx";
import { Link } from 'react-router-dom';

export const MainPage = () => {
  const [dashboards, setDashboards] = useState<Array<{ id: string; title: string; likes: number, ownerId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = async () => {
    try {
      const response = await getPublicDashboardsApi('desc');
      setDashboards(response.dashboards || []);
    } catch (err) {
      setError('Не удалось загрузить доски');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);
  const handleMakePublic = async (id: string) => {
    try {
      await makePublicApi({ id });
      alert('Доска стала публичной!');
      // Опционально: обновить список или добавить publicHash
    } catch (err) {
      alert('Не удалось сделать доску публичной');
    }
  };
  const handleLike = async (id: string) => {
    try {
      const result = await likeDashboardApi({ id });
      setDashboards(prev =>
        prev.map(d => (d.id === id ? { ...d, likes: result.likes } : d))
      );
    } catch (err) {
      alert('Не удалось поставить лайк');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Интерактивные доски</h1>

      {/* Форма создания */}
      <DashboardCreate />

      {/* Список публичных досок */}
      <h2>Публичные доски</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {dashboards.length > 0 ? (
          dashboards.map((dashboard) => (
            <div key={dashboard.id} style={{ display: 'inline-block' }}>
              <DashboardCard
                id={dashboard.id}
                title={dashboard.title}
                ownerId={dashboard.ownerId}
                likes={dashboard.likes}
                onLike={handleLike}
                onMakePublic={handleMakePublic}
              />
            </div>
          ))
        ) : (
          <p>Нет публичных досок</p>
        )}
      </div>

      <EditableDashboard />
    </div>
  );
};