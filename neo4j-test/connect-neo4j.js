import { expect } from 'chai';
import neo4j from 'neo4j-driver';

import { closeDriver, getDriver, initDriver } from '../src/neo4j/neo4j-driver.js';

describe('01. Initiate Driver', () => {

  it('initDriver Should initialize and return a driver', async () => {
    const driver = await initDriver();
    expect(driver).an.instanceof(neo4j.Driver);
  });

  it('getDriver should initialize and/or return the driver', async () => {
    await initDriver();
    const driver = getDriver();
    expect(driver).not.to.be.undefined;
  });

  it('closeDriver should remove driver instance', async () => {
    const driver = await closeDriver();
    expect(driver).to.be.undefined;
  });
});