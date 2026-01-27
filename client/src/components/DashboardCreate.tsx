// src/components/DashboardCreate.tsx
import React, { useState } from 'react';
import { createDashboardApi } from '../api/dashboard';

export const DashboardCreate = () => {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await createDashboardApi({ title });
      // После успешного создания — очищаем поле
      setTitle('');
      // В реальном приложении: можно перенаправить на новую доску
      alert('Доска создана!');
    } catch (err) {
      setError('Не удалось создать доску');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      <h2>Создать новую доску</h2>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название доски"
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            minWidth: '200px',
          }}
        />
        <button
          type="submit"
          disabled={!title.trim() || isCreating}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {isCreating ? 'Создание...' : 'Создать'}
        </button>
      </div>
      {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
    </form>
  );
};