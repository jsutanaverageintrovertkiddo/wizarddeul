import { useEffect, useState } from 'react';

/**
 * Custom hook to manage state and sync it with sessionStorage, used for
 * per-player display preferences (these do not need to be shared with the
 * opponent, so sessionStorage is appropriate).
 */
export const usePersistentState = <T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    const savedValue = sessionStorage.getItem(key);
    return savedValue ? (JSON.parse(savedValue) as T) : defaultValue;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
};