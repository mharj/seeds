import {ApplicationCallbackParams, DiscoveryType, Service, UserCallbackParams} from './types';

interface IProps<HttpRequest = unknown> {
	appDiscovery?: (params: ApplicationCallbackParams) => Promise<Service>;
	userDiscovery?: (params: UserCallbackParams) => Promise<Service>;
	getAuthToken: (req: HttpRequest, type: DiscoveryType) => string;
}

export class Discovery<HttpRequest = unknown> {
	private appDiscovery: IProps<HttpRequest>['appDiscovery'];
	private userDiscovery: IProps<HttpRequest>['userDiscovery'];
	private getAuthToken: IProps<HttpRequest>['getAuthToken'];
	constructor(props: IProps<HttpRequest>) {
		this.appDiscovery = props?.appDiscovery;
		this.userDiscovery = props?.userDiscovery;
		this.getAuthToken = props?.getAuthToken;
		if (!this.getAuthToken) {
			throw new Error('missing getAuthHeader callback');
		}
	}

	public handleDiscovery({type, service, requestVersions}: {type: string; service: string; requestVersions: number[]}, req: HttpRequest): Promise<Service> {
		switch (type) {
			case 'urn:seeds:params:request-type:application':
				if (!this.appDiscovery) {
					throw new Error('no appDiscovery defined');
				}
				return this.appDiscovery({applicationToken: this.getAuthToken(req, type), service, requestVersions});
			case 'urn:seeds:params:request-type:user':
				if (!this.userDiscovery) {
					throw new Error('no userDiscovery defined');
				}
				return this.userDiscovery({userToken: this.getAuthToken(req, type), service, requestVersions});
			default:
				throw new Error('not valid request type');
		}
	}
}
