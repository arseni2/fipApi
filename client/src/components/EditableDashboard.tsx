import React, { useEffect, useState } from 'react';
import { getEditableDashboardsApi, makePublicApi } from '../api/dashboard';
import { DashboardCard } from './DashboardCard'; // используем тот же компонент карточки

export const EditableDashboard = () => {
  const [dashboards, setDashboards] = useState<Array<{ id: string; title: string; likes: number, ownerId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEditable = async () => {
      try {
        const response = await getEditableDashboardsApi();
        setDashboards(response.dashboards || []);
      } catch (err) {
        setError('Не удалось загрузить ваши доски');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEditable();
  }, []);

  const handleLike = async (id: string) => {
    alert('Лайки доступны только для публичных досок');
  };

  const handleMakePublic = async (id: string) => {
    try {
      await makePublicApi({ id });
      alert('Доска стала публичной!');
      // Обновляем список досок
      const response = await getEditableDashboardsApi();
      setDashboards(response.dashboards || []);
    } catch (err) {
      alert('Не удалось сделать доску публичной');
    }
  };

  if (loading) {
    return <div>Загрузка ваших досок...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h2>Ваши доски + редактируемые доски</h2>
      {dashboards.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {dashboards.map((dashboard) => (
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
          ))}
        </div>
      ) : (
        <p>У вас пока нет досок. Создайте первую!</p>
      )}
    </div>
  );
};