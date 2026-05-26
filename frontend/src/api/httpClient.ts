import axios, { AxiosError } from 'axios';

import { AppApiError, type ErrorResponse } from '../types/error';
import { getStoredAccessToken } from '../utils/authStorage';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
const defaultUserKey = import.meta.env.VITE_DEFAULT_USER_KEY ?? 'demo-user';

export const useMockApi = import.meta.env.VITE_USE_MOCK === 'true';

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
});

httpClient.interceptors.request.use((config) => {
  config.headers.set('X-USER-KEY', defaultUserKey);
  const token = getStoredAccessToken();
  if (token) {
    // 로그인 토큰을 백엔드 보호 API 요청에 자동으로 첨부한다.
    // Automatically attaches the login token to protected backend API requests.
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export function toAppApiError(error: unknown): AppApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    if (axiosError.response?.data) {
      return new AppApiError(axiosError.response.data.message, {
        status: axiosError.response.data.status,
        timestamp: axiosError.response.data.timestamp,
      });
    }
    return new AppApiError('Network error. Please check the backend API server.', {
      network: true,
    });
  }
  if (error instanceof Error) {
    return new AppApiError(error.message);
  }
  return new AppApiError('Unknown error');
}

export async function request<T>(callback: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await callback();
    return response.data;
  } catch (error) {
    throw toAppApiError(error);
  }
}
