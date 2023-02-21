import { expect } from 'chai';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addEdge, addNode } from '../src/neo4j/neo4j-functions';
import { deleteAllNodesAndEdges, getGeneNameById, getNumNodes, getNumEdges, getEdgebyId } from '../src/neo4j/test-functions.js';

describe('Example set of tests', function () {

  before('Should create a driver instance and connect to server', async () => {
    await initDriver();
    await deleteAllNodesAndEdges();
  });

  after('Delete nodes and edges, close driver', async function () {
    //await deleteAllNodesAndEdges();
    await closeDriver();
  });

  it('Make MAPK6 node', async function () {
    expect(await getNumNodes()).equal(0);
    await addNode('ncbigene:5597', 'MAPK6');
    expect(await getGeneNameById('ncbigene:5597')).equal('MAPK6');
    expect(await getNumNodes()).equal(1);
  });

  it('Make AKT node', async function () {
    expect(await getNumNodes()).equal(1);
    await addNode('ncbigene:207', 'AKT');
    expect(await getGeneNameById('ncbigene:207')).equal('AKT');
    expect(await getNumNodes()).equal(2);
  });

  it('Make an edge between the two nodes', async function () {
    expect(await getNumEdges()).equal(0);
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    expect(await getNumEdges()).equal(1);
    let edge = await getEdgebyId('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(edge['type']).equal('INTERACTION');
    expect(edge['properties'].type).equal('phosphorylation');
    expect(edge['properties'].sourceId).equal('ncbigene:5597');
    expect(edge['properties'].targetId).equal('ncbigene:207');
    expect(edge['properties'].xref).equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(edge['properties'].doi).equal('10.1126/sciadv.abi6439');
    expect(edge['properties'].pmid).equal('34767444');
    expect(edge['properties'].articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

  it('Ensure searchGeneById works as expected', function () {

  });
});