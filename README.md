# mharj-seeds (Service Discovery System)

## Basic functionality

- always authenticated (user or app context)
- provides list of uri with version and expire time (in seconds) for caching
- getAuthToken callback to solve auth Token string from Request
- userDiscovery callback when request as user context ("type": "urn:seeds:params:request-type:user")
- appDiscovery callback when request as application context ("type": "urn:seeds:params:request-type:application")
- discovery callback should return [Promise&lt;Service&gt;](./src/types.ts#L10) or throw Error

## example discovery setup

```typescript
import {Request} from 'express';

const discovery = new Discovery<Request>({
	getAuthToken: (req, type) => {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith('Bearer ')) {
			throw new HttpError(401, 'auth error');
		}
		return auth.replace(/^Bearer /, '');
	},
	userDiscovery: async ({userToken, service, requestVersions}) => {
		// verify userToken
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
```

## Express Middleware hookup

```typescript
app.post('/.discovery', async (req, res, next) => {
	try {
		res.json(await discovery.handleDiscovery(req.body, req));
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

###  fetch API "user" call example
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