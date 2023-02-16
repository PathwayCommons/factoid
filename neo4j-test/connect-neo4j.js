//import { config } from 'dotenv';
import { expect } from 'chai';

import { closeDriver, getDriver, initDriver } from '../src/neo4j/neo4j-driver.js';

describe('01. Initiate Driver', () => {
    //beforeAll(() => config());
    //afterAll(() => closeDriver());

    it('Should create a driver instance and connect to server', async () => {
        await initDriver();
    });

    it('Driver has been instantiated', () => {
        const driver = getDriver();
        expect(driver).toBeDefined();

        expect(driver.constructor.name).toEqual('Driver');
    });

    it('Driver can verify connectivity', () => {
        const driver = getDriver();
        expect(driver).toBeDefined();
        expect(driver.constructor.name).toEqual('Driver');

        driver.verifyConnectivity()
            .then(() => {
                expect(true).toEqual(true);
            })
            .catch(e => {
                expect(e).toBeUndefined('Unable to verify connectivity');
            });
    });

    it('Close the Driver', () => {
        closeDriver();
    });
});