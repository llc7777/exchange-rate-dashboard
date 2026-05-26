export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}
