import React, { useState } from 'react';
import { shareDashboardApi } from '../api/dashboard';

interface ShareDashboardProps {
  dashboardId: string;
}

export const ShareDashboard: React.FC<ShareDashboardProps> = ({ dashboardId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await shareDashboardApi({ id: dashboardId, email });
      setSuccess(true);
      setEmail(''); // Clear the email field after successful sharing
    } catch (err) {
      setError('Не удалось поделиться доской. Проверьте email и попробуйте снова.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Поделиться доской</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email пользователя"
            style={{
              padding: '8px',
              width: '250px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '10px'
            }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Отправка...' : 'Поделиться'}
          </button>
        </div>
      </form>
      
      {success && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          Приглашение отправлено!
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
};