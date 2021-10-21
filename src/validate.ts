export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNumber(value: unknown): value is string {
	return typeof value === 'number';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown, type: (value: T) => boolean): value is T[] {
	return (
		Array.isArray(value) &&
		value.reduce((last, current) => {
			if (!type(current)) {
				return false;
			}
			return last;
		}, true)
	);
}
