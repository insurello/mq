export const startTime = (): [number, number] => process.hrtime();

export const elapsed = (start: [number, number]): string =>
  `${(process.hrtime(start)[1] / 1000000).toFixed(3)} ms`;
