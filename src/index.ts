import {DiscoveryRequest, Listener} from './Listener';
import {BaseCallbackParams, Service} from './types';
import {isString, isArray, isNumber} from './validate';

interface IProps {
	appDiscovery?: (params: BaseCallbackParams) => Promise<Service>;
	userDiscovery?: (params: BaseCallbackParams) => Promise<Service>;
}

export class Discovery {
	private listeners: Listener[] = [];
	private appDiscovery: IProps['appDiscovery'];
	private userDiscovery: IProps['userDiscovery'];

	constructor(props: IProps) {
		this.appDiscovery = props?.appDiscovery;
		this.userDiscovery = props?.userDiscovery;
		this.handleListenerDiscovery = this.handleListenerDiscovery.bind(this);
	}

	public addListener(listener: Listener): void {
		listener.handleResponse(this.handleListenerDiscovery);
		this.listeners.push(listener);
	}

	public deleteListener(listener: Listener): void {
		const idx = this.listeners.findIndex((l) => l === listener);
		if (idx !== -1) {
			this.listeners.splice(idx, 1);
		}
	}

	public handleListenerDiscovery({type, service, requestVersions}: DiscoveryRequest): Promise<Service> {
		if (!isString(type)) {
			throw new TypeError('type is not a string');
		}
		if (!isString(service)) {
			throw new TypeError('service is not a string');
		}
		if (!isArray(requestVersions, isNumber)) {
			throw new TypeError('requestVersions is not array of numbers');
		}
		switch (type) {
			case 'urn:seeds:params:request-type:application':
				if (!this.appDiscovery) {
					throw new Error('no appDiscovery defined');
				}
				return this.appDiscovery({service, requestVersions});
			case 'urn:seeds:params:request-type:user':
				if (!this.userDiscovery) {
					throw new Error('no userDiscovery defined');
				}
				return this.userDiscovery({service, requestVersions});
			default:
				throw new Error('not valid request type');
		}
	}
}
