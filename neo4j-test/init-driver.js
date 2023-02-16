import { expect } from 'chai';
import { initDriver, getDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';

describe('01. Initiate Driver', () => {

    before('Should create a driver instance and connect to server', async () => {
        await initDriver();
    });

    after('Close driver', function () {
        closeDriver();
    });

    it('Driver has been instantiated', () => {
        const driver = getDriver();
        expect(driver.constructor.name).equal('Driver');
    });

    it('Driver can verify connectivity', () => {
        const driver = getDriver();
        driver.verifyConnectivity()
            .then(() => {
                expect(true).equal(true);
            })
            .catch(e => {
                expect(e).toBeUndefined('Unable to verify connectivity');
            });
    });

});