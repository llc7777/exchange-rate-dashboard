import { useCallback, useEffect, useState } from 'react';

import { addFavorite, deleteFavorite, getFavorites } from '../api/favoriteApi';
import { toAppApiError } from '../api/httpClient';
import type { FavoriteCurrency } from '../types/favorite';

interface UseFavoritesOptions {
  enabled?: boolean;
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const enabled = options.enabled ?? true;
  const [favorites, setFavorites] = useState<FavoriteCurrency[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setFavorites([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setFavorites(await getFavorites());
    } catch (error) {
      setError(toAppApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const toggleFavorite = useCallback(
    async (curUnit: string, favorite: boolean) => {
      if (!enabled) {
        throw new Error('Login is required to manage favorite currencies.');
      }
      setError(null);
      try {
        if (favorite) {
          await deleteFavorite(curUnit);
        } else {
          await addFavorite(curUnit);
        }
        await load();
      } catch (error) {
        setError(toAppApiError(error).message);
      }
    },
    [enabled, load],
  );

  const removeFavorite = useCallback(
    async (curUnit: string) => {
      if (!enabled) {
        throw new Error('Login is required to manage favorite currencies.');
      }
      setError(null);
      try {
        await deleteFavorite(curUnit);
        await load();
      } catch (error) {
        setError(toAppApiError(error).message);
      }
    },
    [enabled, load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { favorites, loading, error, refresh: load, toggleFavorite, removeFavorite };
}
