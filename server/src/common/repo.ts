import {v4 as uuidv4} from 'uuid';
import {readFile, writeFile, mkdir, rename, unlink} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';

const DATA_DIR = resolve(__dirname, '..', '..', 'src', 'db');

export abstract class BaseRepo {
  protected JSON_DIR: string = DATA_DIR;

  protected generateId(): string {
    return uuidv4()
  }

  protected async getJsonData<T>(): Promise<T> {
    const fullPath = join(DATA_DIR, this.JSON_DIR);

    try {
      const content = await readFile(fullPath, 'utf8');
      return JSON.parse(content) as T;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${fullPath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file: ${fullPath}`);
      }
      throw new Error(`Failed to read file ${fullPath}: ${error.message}`);
    }
  }

  protected async writeJsonData<T>(newItemOrItems: T | T[]) {
    const fullPath = join(DATA_DIR, this.JSON_DIR);
    const dir = dirname(fullPath);

    await mkdir(dir, {recursive: true});

    const itemsToAdd = Array.isArray(newItemOrItems) ? newItemOrItems : [newItemOrItems];

    let existingData: T[] = [];

    try {
      const content = await readFile(fullPath, 'utf8');
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        throw new Error(`Expected JSON array in ${fullPath}, got ${typeof parsed}`);
      }
      existingData = parsed;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON in ${fullPath}`);
        }
        throw error;
      }
    }

    const updatedData = [...existingData, ...itemsToAdd];

    const tempFileName = `${Date.now()}-${randomBytes(8).toString('hex')}.tmp`;
    const tempPath = join(tmpdir(), tempFileName);

    try {
      const jsonContent = JSON.stringify(updatedData, null, 2);
      await writeFile(tempPath, jsonContent, 'utf8');
      await rename(tempPath, fullPath);
    } catch (error: any) {
      try {
        await unlink(tempPath);
      } catch {
      }
      throw new Error(`Failed to append to file ${fullPath}: ${error.message}`);
    }
  }

  protected async updateById<T extends { id: string }>(id: string, updateData: Partial<T>): Promise<void> {
    const fullPath = join(DATA_DIR, this.JSON_DIR);
    const dir = dirname(fullPath);

    await mkdir(dir, { recursive: true });

    let existingData: T[] = [];

    try {
      const content = await readFile(fullPath, 'utf8');
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        throw new Error(`Expected JSON array in ${fullPath}, got ${typeof parsed}`);
      }
      existingData = parsed;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON in ${fullPath}`);
        }
        throw error;
      }
      // Если файл не существует, работаем с пустым массивом
    }

    const index = existingData.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Entity with id "${id}" not found in ${fullPath}`);
    }

    // Объединяем существующий объект с новыми данными
    const updatedItem = { ...existingData[index], ...updateData };
    existingData[index] = updatedItem;

    const tempFileName = `${Date.now()}-${randomBytes(8).toString('hex')}.tmp`;
    const tempPath = join(tmpdir(), tempFileName);

    try {
      const jsonContent = JSON.stringify(existingData, null, 2);
      await writeFile(tempPath, jsonContent, 'utf8');
      await rename(tempPath, fullPath);
    } catch (error: any) {
      try {
        await unlink(tempPath);
      } catch {
        // Игнорируем ошибку удаления временного файла
      }
      throw new Error(`Failed to update file ${fullPath}: ${error.message}`);
    }
  }
}