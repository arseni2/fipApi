import {BaseRepo} from "../../common/repo";

export interface IUser {
  id: string
  email: string
  name: string
  password: string
}

class UsersRepo extends BaseRepo {
  JSON_DIR = "users/users.json"

  async create(email: string, password: string, name: string): Promise<IUser> {
    const data = {email, password, id: this.generateId(), name}
    await this.writeJsonData(data);
    return data
  }

  async findById(id: string): Promise<IUser | null> {
    const users = await this.getJsonData<IUser[]>()
    const user = users.filter(user => user.id === id)
    return user[0]
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const users = await this.getJsonData<IUser[]>()
    const user = users.filter(user => user.email === email)
    return user[0]
  }
}

export const usersRepo = new UsersRepo()