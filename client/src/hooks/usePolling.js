import { useEffect, useRef } from 'react';

export function usePolling(fetchFn, intervalMs = 10000) {
  const savedFetch = useRef(fetchFn);

  useEffect(() => {
    savedFetch.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    const id = setInterval(() => savedFetch.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
