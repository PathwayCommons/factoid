import { expect } from 'chai';
import neo4j from 'neo4j-driver';

import { closeDriver, getDriver, initDriver } from '../../src/neo4j/neo4j-driver.js';

describe('Neo4j Initiate Driver', () => {
  it('initDriver Should initialize and return a driver', () => {
    const driver = initDriver();
    expect(driver).an.instanceof(neo4j.Driver);
  });

  it('getDriver should return the driver', () => {
    initDriver();
    const driver = getDriver();
    expect(driver).an.instanceof(neo4j.Driver);
  });

  it('closeDriver should remove driver instance', async () => {
    const driver = await closeDriver();
    expect(driver).to.be.undefined;
  });
});