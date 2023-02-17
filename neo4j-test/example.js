import { expect } from 'chai';
import { initDriver, getDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addNode } from '../src/neo4j/neo4j-functions';

describe('Example set of tests', function () {

  before('Should create a driver instance and connect to server', async () => {
    await initDriver();
  });

  after('Close driver', function () {
    // Delete nodes and edges

    // Close driver
    closeDriver();
  });

  it('Make one node', async function () {
    expect().equal(0);
    await addNode('ncbigene:5597', 'MAPK6');
    expect().equal('MAPK6');
    expect().equal('ncbigene:5597');
  });

  it('Make another node and one edge between', function () {

  });

  it('Read data from two nodes and edge', function () {

  });
});