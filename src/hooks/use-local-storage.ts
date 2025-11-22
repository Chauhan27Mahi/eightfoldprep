'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Helper to check for deep equality
function deepEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Use a ref to store the initial value so it's stable across renders
  const initialValueRef = useRef(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValueRef.current;
      }
    } catch (error) {
      console.log(error);
    }
    return initialValueRef.current;
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      if (!deepEqual(storedValue, valueToStore)) {
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
