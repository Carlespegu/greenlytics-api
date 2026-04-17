import { useEffect, useState } from 'react';

type SetValue<T> = T | ((current: T) => T);

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    const storedValue = window.localStorage.getItem(key);
    if (!storedValue) {
      return initialValue;
    }

    try {
      return JSON.parse(storedValue) as T;
    } catch {
      window.localStorage.removeItem(key);
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  function updateValue(nextValue: SetValue<T>) {
    setValue((currentValue) => (typeof nextValue === 'function'
      ? (nextValue as (current: T) => T)(currentValue)
      : nextValue));
  }

  return [value, updateValue] as const;
}
