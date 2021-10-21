/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {Discovery} from '../src';
import {HttpListener} from '../src/HttpListener';

chai.use(chaiAsPromised);

const authAppHeader = 'Bearer app demo';
const authUserHeader = 'Bearer user demo';
const appType = 'urn:seeds:params:request-type:application';
const userType = 'urn:seeds:params:request-type:user';

type DemoReq = {headers: {auth: string}; body: unknown};

let disco: Discovery;

const httpListener = new HttpListener<DemoReq>({
	authCallback: async (srvReq, headers) => {
		switch (srvReq.type) {
			case 'urn:seeds:params:request-type:user': {
				if (headers.auth !== authUserHeader) {
					throw new Error('not valid user token');
				}
				return;
			}
			case 'urn:seeds:params:request-type:application': {
				if (headers.auth !== authAppHeader) {
					throw new Error('not valid app token');
				}
				return;
			}
		}
		throw new Error('auth error');
	},
});

describe('discovery', () => {
	before(() => {
		disco = new Discovery({
			appDiscovery: async ({service, requestVersions}) => {
				if (requestVersions.indexOf(666) !== -1) {
					throw new Error('no valid app version found');
				}
				return {service, expires_in: 3600, endpoints: []};
			},
			userDiscovery: async ({service, requestVersions}) => {
				if (requestVersions.indexOf(666) !== -1) {
					throw new Error('no valid user version found');
				}
				return {service, expires_in: 3600, endpoints: []};
			},
		});
		disco.addListener(httpListener);
	});
	describe('app route discovery', () => {
		it('should lookup database service with version 1', async () => {
			const req: DemoReq = {headers: {auth: authAppHeader}, body: {type: appType, service: 'database', requestVersions: [1]}};
			const service = await httpListener.handleDiscovery(req);
			expect(service).to.be.eql({service: 'database', expires_in: 3600, endpoints: []});
		});
		it('should rejected with version 666', async () => {
			const req: DemoReq = {headers: {auth: authAppHeader}, body: {type: appType, service: 'database', requestVersions: [666]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(Error, 'no valid app version found');
		});
		it('should rejected with not valid token', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer wrong_token'}, body: {type: appType, service: 'database', requestVersions: [1]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(Error, 'not valid app token');
		});
	});
	describe('user route discovery', () => {
		it('should lookup database service with version 1', async () => {
			const req: DemoReq = {headers: {auth: authUserHeader}, body: {type: userType, service: 'database', requestVersions: [1]}};
			const service = await httpListener.handleDiscovery(req);
			expect(service).to.be.eql({service: 'database', expires_in: 3600, endpoints: []});
		});
		it('should rejected with version 666', async () => {
			const req: DemoReq = {headers: {auth: authUserHeader}, body: {type: userType, service: 'database', requestVersions: [666]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(Error, 'no valid user version found');
		});
		it('should rejected with not valid token', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer wrong_token'}, body: {type: userType, service: 'database', requestVersions: [1]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(Error, 'not valid user token');
		});
	});
	describe('request validation', () => {
		it('should fail on broken body', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo1'}, body: ['hello']};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(TypeError, 'data is not valid record');
		});
		it('should fail on type validation number', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo2'}, body: {type: 1, service: 'database', requestVersions: [1]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(TypeError, 'type is not valid value');
		});
		it('should fail on type validation value', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo3'}, body: {type: 'broken', service: 'database', requestVersions: [1]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(TypeError, 'type is not valid value');
		});
		it('should fail on service validation', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo4'}, body: {type: appType, service: 666, requestVersions: [1]}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(TypeError, 'service is not a string');
		});
		it('should fail on requestVersions validation', async () => {
			const req: DemoReq = {headers: {auth: 'Bearer demo5'}, body: {type: appType, service: 'database', requestVersions: ['1']}};
			await expect(httpListener.handleDiscovery(req)).to.eventually.be.rejectedWith(TypeError, 'requestVersions is not array of numbers');
		});
	});
});
