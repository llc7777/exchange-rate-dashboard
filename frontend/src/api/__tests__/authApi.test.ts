import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('../httpClient', () => ({
  useMockApi: false,
  httpClient: {
    get: getMock,
    post: postMock,
  },
  request: async <T>(callback: () => Promise<{ data: T }>) => {
    const response = await callback();
    return response.data;
  },
}));

import { authPaths, getCurrentUser, loginUser, registerUser } from '../authApi';

describe('authApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    getMock.mockResolvedValue({ data: {} });
    postMock.mockResolvedValue({ data: {} });
  });

  it('uses register API path and English camelCase body', async () => {
    await registerUser({
      email: 'user@example.com',
      password: 'password!123',
      name: 'Exchange User',
    });

    expect(postMock).toHaveBeenCalledWith(authPaths.register, {
      email: 'user@example.com',
      password: 'password!123',
      name: 'Exchange User',
    });
  });

  it('uses login API path', async () => {
    await loginUser({ email: 'user@example.com', password: 'password!123' });

    expect(postMock).toHaveBeenCalledWith(authPaths.login, {
      email: 'user@example.com',
      password: 'password!123',
    });
  });

  it('uses current user API path', async () => {
    await getCurrentUser();

    expect(getMock).toHaveBeenCalledWith(authPaths.me);
  });
});
