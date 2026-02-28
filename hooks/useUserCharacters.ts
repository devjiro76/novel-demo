'use client';

import { useState, useEffect } from 'react';
import type { UserCharacter } from '@/lib/types';

export function useUserCharacters() {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/character')
      .then(res => res.json() as Promise<{ ok: boolean; characters: UserCharacter[] }>)
      .then((data) => {
        if (data.ok) setCharacters(data.characters);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { characters, loading };
}
