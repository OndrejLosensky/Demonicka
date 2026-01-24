import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';

const TOKEN_KEY = 'access_token';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export interface LoginSuccess {
  access_token: string;
  user: { id: string; username: string; name: string | null; role: string };
}

export interface LoginRequires2FA {
  requiresTwoFactor: true;
  message: string;
}

export type LoginResult = LoginSuccess | LoginRequires2FA;

export async function login(username: string, password: string): Promise<LoginResult> {
  const data = await api.post<LoginSuccess | LoginRequires2FA>('/auth/login', {
    username,
    password,
  });
  if ('requiresTwoFactor' in data && data.requiresTwoFactor) {
    return { requiresTwoFactor: true, message: (data as LoginRequires2FA).message ?? '' };
  }
  const success = data as LoginSuccess;
  await setStoredToken(success.access_token);
  return success;
}

export interface User {
  id: string;
  username: string;
  name: string | null;
  role: string;
}

export async function fetchMe(token: string): Promise<User | null> {
  try {
    const user = await api.get<User>('/auth/me', token);
    return user ?? null;
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err?.status === 401) await clearStoredToken();
    return null;
  }
}
