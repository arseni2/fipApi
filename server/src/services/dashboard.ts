import { dashboardRepo } from '../db/dashboard/repo';
import {v4 as uuidv4} from 'uuid';

class DashboardService {
  async create(title: string, userId: string) {
    return dashboardRepo.create(title, userId);
  }

  async like(id: string, userId: string): Promise<number> {
    const dashboard = await dashboardRepo.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    dashboard.likes += 1;
    await dashboardRepo.update(dashboard);
    return dashboard.likes;
  }

  async makePublic(id: string, userId: string) {
    const dashboard = await dashboardRepo.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    if (dashboard.ownerId !== userId) {
      throw new Error('Access denied');
    }
    if (!dashboard.publicHash) {
      dashboard.publicHash = uuidv4(); 
      await dashboardRepo.update(dashboard);
    }
    return dashboard;
  }

  async share(id: string, ownerId: string, userId: string) {
    const dashboard = await dashboardRepo.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    if (dashboard.ownerId !== ownerId) {
      throw new Error('Access denied');
    }

    // Добавляем пользователя в список редакторов, если его там еще нет
    if (!dashboard.editors.includes(userId)) {
      dashboard.editors.push(userId);
      await dashboardRepo.update(dashboard);
    }

    return dashboard;
  }

  async getAllPublic() {
    const dashboards = await dashboardRepo.getAll();
    // Return only dashboards that are public (have publicHash) or owned by the user
    return dashboards.filter(d => d.publicHash != null);
  }

  async sortPublicByLike(sort: 'asc' | 'desc') {
    const dashboards = await this.getAllPublic();
    return dashboards.toSorted((a, b) =>
      sort === 'asc' ? a.likes - b.likes : b.likes - a.likes
    );
  }

  async getAllEditable(userId: string) {
    const dashboards = await dashboardRepo.getAll();
    // Владелец + редакторы
    return dashboards.filter(d => d.ownerId === userId || d.editors.includes(userId));
  }

  async getById(id: string, userId: string) {
    const dashboard = await dashboardRepo.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Проверяем, имеет ли пользователь доступ к доске
    if (dashboard.ownerId !== userId && !dashboard.editors.includes(userId)) {
      throw new Error('Access denied');
    }

    return dashboard;
  }

  async updateBoard(id: string, userId: string, objects: any[]) {
    const dashboard = await dashboardRepo.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Проверяем, имеет ли пользователь доступ к доске
    if (dashboard.ownerId !== userId && !dashboard.editors.includes(userId)) {
      throw new Error('Access denied');
    }

    // Обновляем объекты доски
    dashboard.objects = objects;
    await dashboardRepo.update(dashboard);

    // Возвращаем обновленную доску (используем обновленный объект dashboard)
    return dashboard;
  }

  async findByPublicHash(hash: string) {
    const all = await dashboardRepo.getAll();
    return all.find(d => d.publicHash === hash);
  }
}

export const dashboardService = new DashboardService();