export function square(x: number): number {
  return x * x;
}

export function fibonacci(x: number): number {
  if (x < 2) {
    return x;
  }
  return fibonacci(x - 1) + fibonacci(x - 2);
}