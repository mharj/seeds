import {isString} from './validate';

/* eslint-disable camelcase */
const discoveryTypes = ['urn:seeds:params:request-type:application', 'urn:seeds:params:request-type:user'] as const;
export type DiscoveryType = typeof discoveryTypes[number];

export function isDiscoveryType(type: unknown): type is DiscoveryType {
	return isString(type) && discoveryTypes.findIndex((c) => c === type) !== -1;
}

interface Endpoint {
	uri: string;
	version: number;
}

export interface Service {
	/** service name */
	service: string;
	/** URI expiration in seconds */
	expires_in: number;
	/** URI endpoint list and versions */
	endpoints: Endpoint[];
}

export interface BaseCallbackParams {
	service: string;
	requestVersions: number[];
}

export interface ApplicationCallbackParams extends BaseCallbackParams {
	applicationToken: string;
}

export interface UserCallbackParams extends BaseCallbackParams {
	userToken: string;
}
