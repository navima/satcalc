export function timeMethod(f: (...args: unknown[]) => unknown): number {
	const start = performance.now();
	f();
	return performance.now() - start;
}

export function timeFunc<T>(f: (...args: unknown[]) => T): [T, number] {
	const start = performance.now();
	const res = f();
	return [res, performance.now() - start];
}