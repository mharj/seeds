/* eslint-disable camelcase */
const discoveryTypes = ['urn:seeds:params:request-type:application', 'urn:seeds:params:request-type:user'] as const;
export type DiscoveryType = typeof discoveryTypes[number];

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

interface BaseCallbackParams {
	service: string;
	requestVersions: number[];
}

export interface ApplicationCallbackParams extends BaseCallbackParams {
	applicationToken: string;
}

export interface UserCallbackParams extends BaseCallbackParams {
	userToken: string;
}
