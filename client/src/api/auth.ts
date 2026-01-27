import {API_URL} from "./base.ts";

interface IPayloadSignUp {
  email: string;
  name: string;
  password: string;
}
interface IResponseSignUp {
  status: string;
}
interface IErrorResponseSignUp {
  errors: Record<keyof IPayloadSignUp, string[]>;
}
export const signUpApi = async (payload: IPayloadSignUp): Promise<IResponseSignUp | IErrorResponseSignUp> => {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      return errorData;
    }

    return res.json();
  } catch (error) {
    console.error('Sign up error:', error);
    throw new Error('Network error occurred during sign up');
  }
}


interface IPayloadSignIn {
  email: string;
  password: string;
}
interface IResponseSignIn {
  token: string;
}
interface IErrorResponseSignIn {
  errors: Record<keyof IPayloadSignIn, string[]>;
}
export const signInApi = async (payload: IPayloadSignIn): Promise<IResponseSignIn | IErrorResponseSignIn> => {
  try {
    const res = await fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      return errorData;
    }

    return res.json();
  } catch (error) {
    console.error('Sign in error:', error);
    throw new Error('Network error occurred during sign in');
  }
}