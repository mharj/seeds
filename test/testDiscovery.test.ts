/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {Discovery} from '../src';

chai.use(chaiAsPromised);

const authHeader = 'Bearer demo';
const appType = 'urn:seeds:params:request-type:application';

type DemoReq = {headers: {auth: string}};

let disco: Discovery<DemoReq>;

describe('discovery', () => {
	before(() => {
		disco = new Discovery<DemoReq>({
			getAuthToken: (req, type) => {
				return req.headers.auth;
			},
			appDiscovery: async ({applicationToken, service, requestVersions}) => {
				if (applicationToken !== authHeader) {
					throw new Error('not valid token');
				}
				if (requestVersions.indexOf(666) !== -1) {
					throw new Error('no valid version found');
				}
				return {service, expires_in: 3600, endpoints: []};
			},
		});
	});
	it('should lookup database service with version 1', async () => {
		const req: DemoReq = {headers: {auth: authHeader}};
		const service = await disco.handleDiscovery({type: appType, service: 'database', requestVersions: [1]}, req);
		expect(service).to.be.eql({service: 'database', expires_in: 3600, endpoints: []});
	});
	it('should fail rejected with version 666', async () => {
		const req: DemoReq = {headers: {auth: authHeader}};
		await expect(disco.handleDiscovery({type: appType, service: 'database', requestVersions: [666]}, req)).to.eventually.be.rejectedWith(
			Error,
			'no valid version found',
		);
	});
	it('should fail rejected with not valid token', async () => {
		const req: DemoReq = {headers: {auth: 'Bearer wrong_token'}};
		await expect(disco.handleDiscovery({type: appType, service: 'database', requestVersions: [1]}, req)).to.eventually.be.rejectedWith(
			Error,
			'not valid token',
		);
	});
});
