import type { AuthLoginRequest, AuthRegisterRequest, AuthResponse, AuthUser } from '../types/auth';
import { httpClient, request, useMockApi } from './httpClient';
import { getMockCurrentUser, loginMockUser, registerMockUser } from './mockApi';

export const authPaths = {
  register: '/auth/register',
  login: '/auth/login',
  me: '/auth/me',
};

export async function registerUser(body: AuthRegisterRequest): Promise<AuthResponse> {
  if (useMockApi) {
    return registerMockUser(body);
  }
  return request(() => httpClient.post<AuthResponse>(authPaths.register, body));
}

export async function loginUser(body: AuthLoginRequest): Promise<AuthResponse> {
  if (useMockApi) {
    return loginMockUser(body);
  }
  return request(() => httpClient.post<AuthResponse>(authPaths.login, body));
}

export async function getCurrentUser(): Promise<AuthUser> {
  if (useMockApi) {
    return getMockCurrentUser();
  }
  return request(() => httpClient.get<AuthUser>(authPaths.me));
}
