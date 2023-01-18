
export function gaussianKernel(size: number): number[] {
  const sigma = size / (2 * 3);
  const half = (size - 1) / 2;
  const weights: number[] = Array.from(Array(size), (_, i) => Math.exp(-(i - half)*(i - half) / (2*sigma*sigma)));
  const denominator = weights.reduce((prev, curr) => prev+curr, 0);  // calc sum, not analytic integration, for approx error
  return weights.map((v) => v/denominator);
}

export function gaussianKernelVec3(size: [number, number, number]): [number, number, number][] {
  let length = Math.max(...size);
  let half = (length - 1) / 2;
  let sigma = size.map(v => v / (2 * 3));
  let weights = Array.from(
    Array(length),
    (_, i) => size.map((_, j) =>
      Math.exp(-(i - half)*(i - half) / (2*sigma[j]*sigma[j]))
    )
  );
  /* calc sum, not analytic integration, for approx error */
  const denominator = weights.reduce((prev, curr) => prev.map((v, i) => v + curr[i]), [0, 0, 0]);
  return weights.map(vec => vec.map((v, j) => v / denominator[j])) as [number, number, number][];
}

export function gaussianDerivativeKernel(size: [number, number, number]): [number, number, number][] {
  let length = Math.max(...size);
  let half = (length - 1) / 2;
  let sigma = size.map(v => v / (2 * 3));
  let weights = Array.from(
    Array(length),
    (_, i) => size.map((_, j) =>
      -(i-half) / (sigma[j]*sigma[j]) * Math.exp(-(i-half)*(i-half) / (2*sigma[j]*sigma[j]))
    )
  );
  return weights as [number, number, number][];
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  let t = Math.min(1.0, Math.max(0.0, (x-edge0) / (edge1 - edge0)));
  return t*t*(3-2*t);
}
