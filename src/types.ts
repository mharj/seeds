/* eslint-disable camelcase */
const discoveryTypes = ['urn:seeds:params:request-type:application', 'urn:seeds:params:request-type:user'] as const;
export type DiscoveryType = typeof discoveryTypes[number];

interface Endpoint {
	uri: string;
	version: number;
}

export interface Service {
	service: string;
	expires_in: number;
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
