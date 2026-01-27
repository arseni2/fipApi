import {BaseRepo} from '../../common/repo';
import {z} from "zod";

export interface IDashboard {
  id: string;
  title: string;
  ownerId: string;
  editors: string[];
  likes: number;
  publicHash?: string;
  objects?: any[]; // Массив объектов доски
}

export const DashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  ownerId: z.string(),
  editors: z.array(z.string()),
  likes: z.number(),
  publicHash: z.string().optional(),
  objects: z.array(z.any()).optional(),
});

class DashboardRepo extends BaseRepo {
  JSON_DIR = 'dashboard/dashboard.json';

  async create(title: string, userId: string): Promise<IDashboard> {
    const data = {
      id: this.generateId(),
      title,
      ownerId: userId,
      editors: [],
      likes: 0,
      objects: [], // Инициализируем пустым массивом
    };
    await this.writeJsonData(data);
    return data;
  }

  async getAll(): Promise<IDashboard[]> {
    return this.getJsonData<IDashboard[]>();
  }

  async findById(id: string): Promise<IDashboard | undefined> {
    const all = await this.getAll();
    return all.find(d => d.id === id);
  }

  async update(updated: IDashboard): Promise<void> {
    await this.updateById(updated.id, updated);
  }
}

export const dashboardRepo = new DashboardRepo();