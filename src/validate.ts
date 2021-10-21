export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNumber(value: unknown): value is string {
	return typeof value === 'number';
}

export function isArray(value: unknown, type: (value: unknown) => boolean): value is unknown[] {
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
