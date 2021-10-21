import {DiscoveryType, isDiscoveryType, Service} from './types';
import {isArray, isNumber, isRecord, isString} from './validate';

export interface DiscoveryRequest {
	type: DiscoveryType;
	service: string;
	requestVersions: number[];
}

export abstract class Listener {
	protected callback: (request: DiscoveryRequest) => Promise<Service>;
	public handleResponse(callback: (request: DiscoveryRequest) => Promise<Service>): void {
		this.callback = callback;
	}

	protected buildDiscoveryRequest(body: unknown): DiscoveryRequest {
		if (!isRecord(body)) {
			throw new TypeError('data is not valid record');
		}
		const {type, service, requestVersions} = body;
		if (!isDiscoveryType(type)) {
			throw new TypeError('type is not valid value');
		}
		if (!isString(service)) {
			throw new TypeError('service is not a string');
		}
		if (!isArray<number>(requestVersions, isNumber)) {
			throw new TypeError('requestVersions is not array of numbers');
		}
		return {type, service, requestVersions};
	}
}
