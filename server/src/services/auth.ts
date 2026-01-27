import {usersRepo} from "../db/users/repo";
import jwt from "jsonwebtoken";

interface IPayload {
  id: string
}

class AuthService {

  async generateJwtToken(payload: IPayload): Promise<string> {
    return jwt.sign({
      data: payload
    }, '123', {expiresIn: '2 days'});
  }

  parseToken(token: string): IPayload {
    try {
      const tokenData = jwt.verify(token, '123') as { data: IPayload }
      return tokenData.data;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Failed to parse token');
    }
  }

  async signUp(email: string, password: string, name: string) {
    const existUser = await usersRepo.findByEmail(email);
    if (existUser) {
      return {
        errors: {
          email: ["Почта должна быть уникальной"],
        }
      }
    }
    await usersRepo.create(email, password, name)

    // return {
    //   token: await this.generateJwtToken({id: user.id})
    // };
  }

  async signIn(email: string, password: string) {
    const user = await usersRepo.findByEmail(email)
    if (!user) {
      return null;
    }
    if (user.password !== password) {
      return null
    }

    return {
      token: await this.generateJwtToken({id: user.id})
    };
  }

  me(token: string) {
    const payload = this.parseToken(token);
    return usersRepo.findById(payload.id)
  }
}

export const authService = new AuthService