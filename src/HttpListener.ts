import {DiscoveryRequest, Listener} from './Listener';
import {Service} from './types';

interface HttpRequestLike {
	headers: unknown;
	body: unknown;
}

type AuthCallback<HttpRequest extends HttpRequestLike> = (type: DiscoveryRequest, headers: HttpRequest['headers']) => Promise<void>;

export class HttpListener<HttpRequest extends HttpRequestLike> extends Listener {
	private authCallback: AuthCallback<HttpRequest>;

	constructor({authCallback}: {authCallback: AuthCallback<HttpRequest>}) {
		super();
		this.authCallback = authCallback;
	}

	public async handleDiscovery(req: HttpRequest): Promise<Service> {
		if (!this.callback) {
			throw new Error('no callback');
		}
		const srvReq = this.buildDiscoveryRequest(req.body);
		await this.authCallback(srvReq, req.headers);
		return this.callback(srvReq);
	}
}
