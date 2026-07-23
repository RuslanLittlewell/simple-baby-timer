export const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatElapsed = (seconds: number) =>
  `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor((seconds % 3600) / 60))}:${pad2(seconds % 60)}`;
