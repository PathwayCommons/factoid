import { expect } from 'chai';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addNode, deleteAllNodesAndEdges, getNumNodes } from '../src/neo4j/neo4j-functions';

describe('Example set of tests', function () {

  before('Should create a driver instance and connect to server', async () => {
    await initDriver();
    await deleteAllNodesAndEdges();
  });

  after('Delete nodes and edges, close driver', async function () {
    await deleteAllNodesAndEdges();
    await closeDriver();
  });

  it('Make one node', async function () {
    expect(await getNumNodes()).equal(0);
    await addNode('ncbigene:5597', 'MAPK6');
    //expect().equal('MAPK6');
    expect(await getNumNodes()).equal(1);
  });

  it('Make another node', function () {

  });

  it('Make an edge between the two nodes', function () {

  });

  it('Ensure searchGeneById works as expected', function () {

  });
});