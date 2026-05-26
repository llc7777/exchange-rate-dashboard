import { httpClient, request, useMockApi } from './httpClient';
import { addMockFavorite, deleteMockFavorite, getMockFavorites } from './mockApi';
import type { FavoriteCurrency } from '../types/favorite';

export const favoritePaths = {
  list: '/favorites',
  item: (curUnit: string) => `/favorites/${encodeURIComponent(curUnit)}`,
};

export async function getFavorites(): Promise<FavoriteCurrency[]> {
  if (useMockApi) {
    return getMockFavorites();
  }
  return request(() => httpClient.get<FavoriteCurrency[]>(favoritePaths.list));
}

export async function addFavorite(curUnit: string): Promise<FavoriteCurrency> {
  if (useMockApi) {
    return addMockFavorite(curUnit);
  }
  return request(() => httpClient.post<FavoriteCurrency>(favoritePaths.item(curUnit)));
}

export async function deleteFavorite(curUnit: string): Promise<void> {
  if (useMockApi) {
    return deleteMockFavorite(curUnit);
  }
  await request(() => httpClient.delete<void>(favoritePaths.item(curUnit)));
}
