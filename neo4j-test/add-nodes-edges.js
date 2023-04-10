import { expect } from 'chai';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addEdge, addNode, getInteractions, getNeighbouringNodes, neighbourhood } from '../src/neo4j/neo4j-functions';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge } from '../src/neo4j/test-functions.js';

describe('02. Tests for addNode, addEdge and neighbourhood', function () {

  before('Should create a driver instance and connect to server', async function () {
    await initDriver();
  });

  after('Close driver', async function () {
    await closeDriver();
  });

  beforeEach('Delete nodes and edges', async function () {
    await deleteAllNodesAndEdges();
  });

  it('Make one node', async function () {
    expect(await getNumNodes()).to.equal(0);
    await addNode('ncbigene:5597', 'MAPK6');
    expect(await getGeneName('ncbigene:5597')).to.equal('MAPK6');
    expect(await getNumNodes()).to.equal(1);
  });

  it('Make an edge between the two nodes', async function () {
    expect(await getNumEdges()).equal(0);
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      [],
      'ncbigene:5597',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    expect(await getNumEdges()).to.equal(1);
    let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(edge.type).to.equal('INTERACTION');
    expect(edge.properties.type).to.equal('phosphorylation');
    expect(edge.properties.sourceId).to.equal('ncbigene:5597');
    expect(edge.properties.targetId).to.equal('ncbigene:207');
    expect(edge.properties.sourceComplex).to.equal('');
    expect(edge.properties.targetComplex).to.equal('');
    expect(edge.properties.component).to.deep.equal([]);
    expect(edge.properties.xref).to.equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(edge.properties.doi).to.equal('10.1126/sciadv.abi6439');
    expect(edge.properties.pmid).to.equal('34767444');
    expect(edge.properties.articleTitle).to.equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

  it('Making a duplicate node fails', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    expect(await getNumNodes()).to.equal(2);
    await addNode('ncbigene:5597', 'MAPK6');
    await addNode('ncbigene:5597', 'This is a dummy name');
    expect(await getNumNodes()).to.equal(2);
    expect(await getGeneName('ncbigene:5597')).to.equal('MAPK6');
  });

  it('Making a duplicate edge fails', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      [],
      'ncbigene:5597',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    expect(await getNumEdges()).equal(1);
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      [],
      'ncbigene:5597',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'This is a dummy type',
      [],
      'nc7',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '3444',
      'MAPK6-AKT signaling ');
    expect(await getNumEdges()).equal(1);
    let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(edge.type).to.equal('INTERACTION');
    expect(edge.properties.type).to.equal('phosphorylation');
    expect(edge.properties.sourceId).to.equal('ncbigene:5597');
    expect(edge.properties.targetId).to.equal('ncbigene:207');
    expect(edge.properties.sourceComplex).to.equal('');
    expect(edge.properties.targetComplex).to.equal('');
    expect(edge.properties.component).to.deep.equal([]);
    expect(edge.properties.xref).to.equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(edge.properties.doi).to.equal('10.1126/sciadv.abi6439');
    expect(edge.properties.pmid).to.equal('34767444');
    expect(edge.properties.articleTitle).to.equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

  it('Ensure neighbourhood works as expected for MAPK6', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      [],
      'ncbigene:5597',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let mapk6Relationships = await getInteractions('ncbigene:5597');

    expect(mapk6Relationships.length).to.equal(1);
    expect(mapk6Relationships[0].type).to.equal('phosphorylation');
    expect(mapk6Relationships[0].sourceId).to.equal('ncbigene:5597');
    expect(mapk6Relationships[0].targetId).to.equal('ncbigene:207');
    expect(mapk6Relationships[0].sourceComplex).to.equal('');
    expect(mapk6Relationships[0].targetComplex).to.equal('');
    expect(mapk6Relationships[0].component).to.deep.equal([]);
    expect(mapk6Relationships[0].xref).to.equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(mapk6Relationships[0].doi).to.equal('10.1126/sciadv.abi6439');
    expect(mapk6Relationships[0].pmid).to.equal('34767444');
    expect(mapk6Relationships[0].articleTitle).to.equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let mapk6NeighbouringNodes = await getNeighbouringNodes('ncbigene:5597');

    expect(mapk6NeighbouringNodes.length).to.equal(1);
    expect(mapk6NeighbouringNodes[0].id).to.equal('ncbigene:207');
    expect(mapk6NeighbouringNodes[0].name).to.equal('AKT');
  });

  it('Ensure neighbourhood works as expected for AKT', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      [],
      'ncbigene:5597',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let aktRelationships = await getInteractions('ncbigene:207');

    expect(aktRelationships.length).to.equal(1);
    expect(aktRelationships[0].type).to.equal('phosphorylation');
    expect(aktRelationships[0].sourceId).to.equal('ncbigene:5597');
    expect(aktRelationships[0].targetId).to.equal('ncbigene:207');
    expect(aktRelationships[0].sourceComplex).to.equal('');
    expect(aktRelationships[0].targetComplex).to.equal('');
    expect(aktRelationships[0].component).to.deep.equal([]);
    expect(aktRelationships[0].xref).to.equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(aktRelationships[0].doi).to.equal('10.1126/sciadv.abi6439');
    expect(aktRelationships[0].pmid).to.equal('34767444');
    expect(aktRelationships[0].articleTitle).to.equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let aktNeighbouringNodes = await getNeighbouringNodes('ncbigene:207');

    expect(aktNeighbouringNodes.length).to.equal(1);
    expect(aktNeighbouringNodes[0].id).to.equal('ncbigene:5597');
    expect(aktNeighbouringNodes[0].name).to.equal('MAPK6');
  });

  it('Search for a molecule in an empty database yields null', async function () {
    expect(await neighbourhood('ncbigene:207')).to.be.null;
    expect(await getInteractions('ncbigene:207')).to.be.null;
    expect(await getNeighbouringNodes('ncbigene:207')).to.be.null;
  });

  it('Search for a non-existing molecule in a non-empty database yields null', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      [],
      'ncbigene:5597',
      'ncbigene:207',
      '',
      '',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    expect(await neighbourhood('ncbigene:217')).to.be.null;
    expect(await getInteractions('ncbigene:217')).to.be.null;
    expect(await getNeighbouringNodes('ncbigene:217')).to.be.null;
  });
});