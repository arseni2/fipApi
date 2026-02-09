import { API_URL } from './base';

interface ICreateDashboard {
  title: string;
}

interface ILikeDashboard {
  id: string;
}

interface IMakePublic {
  id: string;
}

// Создать доску
export const createDashboardApi = async (payload: ICreateDashboard) => {
  try {
    const res = await fetch(`${API_URL}/dashboard/create`, {
      method: 'POST',
      headers: {
        "ClientId": "123",
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create dashboard');
    }

    return res.json();
  } catch (error) {
    console.error('Create dashboard error:', error);
    throw error;
  }
};

// Поставить лайк
export const likeDashboardApi = async (payload: ILikeDashboard) => {
  try {
    const res = await fetch(`${API_URL}/dashboard/like`, {
      method: 'POST',
      headers: {
        "ClientId": "123",
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to like dashboard');
    }

    return res.json();
  } catch (error) {
    console.error('Like dashboard error:', error);
    throw error;
  }
};

// Сделать публичной
export const makePublicApi = async (payload: IMakePublic) => {
  try {
    const res = await fetch(`${API_URL}/dashboard/make-public`, {
      method: 'POST',
      headers: {
        "ClientId": "123",
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to make public');
    }

    return res.json();
  } catch (error) {
    console.error('Make public error:', error);
    throw error;
  }
};

// Получить публичные доски
export const getPublicDashboardsApi = async (sort: 'asc' | 'desc' = 'desc') => {
  try {
    const res = await fetch(`${API_URL}/dashboard/public?sort=${sort}`, {
      headers: {
        "ClientId": "123",
        'Authorization': localStorage.getItem('token') || '',
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch public dashboards');
    }

    return res.json();
  } catch (error) {
    console.error('Get public dashboards error:', error);
    throw error;
  }
};

// Получить редактируемые доски
export const getEditableDashboardsApi = async () => {
  try {
    const res = await fetch(`${API_URL}/dashboard/editable`, {
      headers: {
        "ClientId": "123",
        'Authorization': localStorage.getItem('token') || '',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch editable dashboards');
    }

    return res.json();
  } catch (error) {
    console.error('Get editable dashboards error:', error);
    throw error;
  }
};

// Получить одну доску по ID (для владельца/редактора)
export const getDashboardByIdApi = async (id: string) => {
  try {
    const res = await fetch(`${API_URL}/dashboard/${id}`, {
      headers: {
        "ClientId": "123",
        'Authorization': localStorage.getItem('token') || '',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch dashboard');
    }

    return res.json();
  } catch (error) {
    console.error('Get dashboard by ID error:', error);
    throw error;
  }
};

// Обновить доску
export const updateBoardApi = async (payload: { id: string; objects: any[] }) => {
  const { id, objects } = payload;
  try {
    const res = await fetch(`${API_URL}/dashboard/${id}`, {
      method: 'PUT',
      headers: {
        "ClientId": "123",
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: JSON.stringify({ objects }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update dashboard');
    }

    return res.json();
  } catch (error) {
    console.error('Update board error:', error);
    throw error;
  }
};

// Поделиться доской с другим пользователем
export const shareDashboardApi = async (payload: { id: string; email: string }) => {
  try {
    const res = await fetch(`${API_URL}/dashboard/share`, {
      method: 'POST',
      headers: {
        "ClientId": "123",
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to share dashboard');
    }

    return res.json();
  } catch (error) {
    console.error('Share dashboard error:', error);
    throw error;
  }
};

// Получить публичную доску по hash (без авторизации)
export const getPublicDashboardByHashApi = async (hash: string) => {
  try {
    const res = await fetch(`${API_URL}/board/${hash}`, {
      headers: {
        "ClientId": "123",
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch public dashboard');
    }

    return res.json();
  } catch (error) {
    console.error('Get public dashboard by hash error:', error);
    throw error;
  }
};

export interface Dashboard {
  id: string;
  title: string;
}