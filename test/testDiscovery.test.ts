/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {Discovery} from '../src';

chai.use(chaiAsPromised);

const authAppHeader = 'Bearer app demo';
const authUserHeader = 'Bearer user demo';
const appType = 'urn:seeds:params:request-type:application';
const userType = 'urn:seeds:params:request-type:user';

type DemoReq = {headers: {auth: string}};

let disco: Discovery<DemoReq>;

describe('discovery', () => {
	before(() => {
		disco = new Discovery<DemoReq>({
			getAuthToken: (req, type) => {
				return req.headers.auth;
			},
			appDiscovery: async ({applicationToken, service, requestVersions}) => {
				if (applicationToken !== authAppHeader) {
					throw new Error('not valid app token');
				}
				if (requestVersions.indexOf(666) !== -1) {
					throw new Error('no valid app version found');
				}
				return {service, expires_in: 3600, endpoints: []};
			},
			userDiscovery: async ({userToken, service, requestVersions}) => {
				if (userToken !== authUserHeader) {
					throw new Error('not valid user token');
				}
				if (requestVersions.indexOf(666) !== -1) {
					throw new Error('no valid user version found');
				}
				return {service, expires_in: 3600, endpoints: []};
			},
		});
	});
	describe('app token discovery', () => {
		it('should lookup database service with version 1', async () => {
			const req: DemoReq = {headers: {auth: authAppHeader}};
			const service = await disco.handleDiscovery({type: appType, service: 'database', requestVersions: [1]}, req);
			expect(service).to.be.eql({service: 'database', expires_in: 3600, endpoints: []});
		});
		it('should rejected with version 666', async () => {
			const req: DemoReq = {headers: {auth: authAppHeader}};
			await expect(disco.handleDiscovery({type: appType, service: 'database', requestVersions: [666]}, req)).to.eventually.be.rejectedWith(
				Error,
				'no valid app version found',
			);
		});
		it('should rejected with not valid token', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer wrong_token'}};
			await expect(disco.handleDiscovery({type: appType, service: 'database', requestVersions: [1]}, req)).to.eventually.be.rejectedWith(
				Error,
				'not valid app token',
			);
		});
	});
	describe('user token discovery', () => {
		it('should lookup database service with version 1', async () => {
			const req: DemoReq = {headers: {auth: authUserHeader}};
			const service = await disco.handleDiscovery({type: userType, service: 'database', requestVersions: [1]}, req);
			expect(service).to.be.eql({service: 'database', expires_in: 3600, endpoints: []});
		});
		it('should rejected with version 666', async () => {
			const req: DemoReq = {headers: {auth: authUserHeader}};
			await expect(disco.handleDiscovery({type: userType, service: 'database', requestVersions: [666]}, req)).to.eventually.be.rejectedWith(
				Error,
				'no valid user version found',
			);
		});
		it('should rejected with not valid token', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer wrong_token'}};
			await expect(disco.handleDiscovery({type: userType, service: 'database', requestVersions: [1]}, req)).to.eventually.be.rejectedWith(
				Error,
				'not valid user token',
			);
		});
	});
	describe('request validation', () => {
		it('should fail on type validation', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo1'}};
			const brokenType = {type: 1, service: 'database', requestVersions: [1]} as any;
			expect(disco.handleDiscovery.bind(this, brokenType, req)).to.throw(TypeError, 'type is not a string');
		});
		it('should fail on service validation', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo2'}};
			const brokenType = {type: appType, service: 666, requestVersions: [1]} as any;
			expect(disco.handleDiscovery.bind(this, brokenType, req)).to.throw(TypeError, 'service is not a string');
		});
		it('should fail on requestVersions validation', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo3'}};
			const brokenType = {type: appType, service: 'database', requestVersions: ['1']} as any;
			expect(disco.handleDiscovery.bind(this, brokenType, req)).to.throw(TypeError, 'requestVersions is not array of numbers');
		});
	});
});
