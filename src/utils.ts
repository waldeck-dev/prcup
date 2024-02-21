export function parseRawNumbers(rawNumbers: string): number[] {
  const out: number[] = [];

  for (const number of rawNumbers.split(",")) {
    const n = parseInt(number);
    if (!Number.isNaN(n)) {
      out.push(n);
    }
  }

  return out.sort((a: number, b: number) => a - b);
}
