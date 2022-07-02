import { onDestroy } from 'svelte';

export function onInterval(callback: () => void, milliseconds: number) {
  const interval = setInterval(callback, milliseconds);

  onDestroy(() => {
    clearInterval(interval);
  });
}

export function getTimeRemaining(endtime: Date): [number, number, number, number] {
  let nowInMs = (new Date).getTime();
  let endInMs = endtime.getTime();
  const total = endInMs - nowInMs;
  if(total <= 0) {
    return [0, 0, 0, 0];
  }
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return [
    days,
    hours,
    minutes,
    seconds
  ];
}