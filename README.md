# mharj-seeds (Service Discovery System)

## Basic functionality

- provides list of uri with version and expire time (in seconds) for caching
- userDiscovery callback when request as user context ("type": "urn:seeds:params:request-type:user")
- appDiscovery callback when request as application context ("type": "urn:seeds:params:request-type:application")
- discovery callback should return [Promise&lt;Service&gt;](./src/types.ts#L10) or throw Error
- HttpListener as example to utilize something like ExpressJS and auth tokens

## example discovery setup

```typescript
import {Request} from 'express';

// build http listener (Express) and auth callback
export const httpListener = new HttpListener<Request>({
	authCallback: async (srvReq, headers) => {
		const auth = headers.authorization;
		if (!auth || !auth.startsWith('Bearer ')) {
			throw new Error('auth error');
		}
		auth.replace(/^Bearer /, '');
		if (srvReq.type === 'urn:seeds:params:request-type:application') {
			// verify application token
		}
		if (srvReq.type === 'urn:seeds:params:request-type:user') {
			// verify user token
		}
		throw new Error('auth error');
	},
});

// discovery service and version router
const discovery = new Discovery({
	userDiscovery: async ({service, requestVersions}) => {
		switch (service) {
			case 'roles': {
				if (requestVersions.indexOf(1) !== -1) {
					return {
						service,
						expires_in: 3600,
						endpoints: [
							{
								uri: `${await getBaseUrl()}/api/roles`,
								version: 1,
							},
						],
					};
				}
				break;
			}
		}
		throw new HttpError(404, `service not found`);
	},
});

// attach http listener to discovery
discovery.addListener(httpListener);

```

## Express Middleware hookup

```typescript
app.post('/.discovery', async (req, res, next) => {
	try {
		res.json(await httpListener.handleDiscovery(req));
	} catch (err) {
		next(err);
	}
});
```

### example JSON request (Bearer token as user)

```json
{
	"type": "urn:seeds:params:request-type:user",
	"service": "roles",
	"requestVersions": [1]
}
```

### example JSON request (Bearer token as application, requires appDiscovery callback)

```json
{
	"type": "urn:seeds:params:request-type:application",
	"service": "background_images",
	"requestVersions": [1]
}
```

### example JSON response

```json
{
	"service": "roles",
	"expires_in": 3600,
	"endpoints": [
		{
			"uri": "http://some_base_url/api/roles",
			"version": 1
		}
	]
}
```

### fetch API "user" call example

```typescript
export async function getRoleApiUri() {
	const version = 1;
	const body = JSON.stringify({
		type: 'urn:seeds:params:request-type:user',
		service: 'roles',
		requestVersions: [version],
	});
	const headers = new Headers();
	headers.set('Authorization', `Bearer ${await getAccessToken()}`);
	headers.set('Content-type', 'application/json');
	headers.set('Content-length', '' + body.length);
	const res = await fetch('https://some_backend_service/.discovery', {method: 'POST', headers, body});
	if (res.status !== 200) {
		throw new Error(`discovery http error: ${res.status}`);
	}
	const service = await res.json();
	const {uri} = service.endpoints.find((endpoint) => endpoint.version === version) || {};
	if (!uri) {
		throw new Error(`discovery error: no endpoint found for ${version}`);
	}
	return uri;
}
```
