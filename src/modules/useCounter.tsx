import { useState, useCallback } from 'react';

export default function useCounter () {
  const [data, setCounter] = useState(0);
  const increment = useCallback(() => setCounter(state => state + 1), [data]);
  const decrement = useCallback(() => setCounter(state => state - 1), [data]);
  return { data, callbacks: [increment, decrement] };
};
