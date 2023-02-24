import { expect } from 'chai';
import { initDriver, closeDriver } from '../src/neo4j/neo4j-driver.js';
import { addEdge, addNode, getInteractions, getNeighbouringNodes, searchByGeneId } from '../src/neo4j/neo4j-functions';
import { deleteAllNodesAndEdges, getGeneName, getNumNodes, getNumEdges, getEdge, getNode } from '../src/neo4j/test-functions.js';

describe('Tests for addNode, addEdge and seachByGeneId', function () {

  before('Should create a driver instance and connect to server', async () => {
    await initDriver();
  });

  after('Close driver', async function () {
    await closeDriver();
  });

  beforeEach('Delete nodes and edges', async function () {
    await deleteAllNodesAndEdges();
  });

  it('Make one node', async function () {
    expect(await getNumNodes()).equal(0);
    await addNode('ncbigene:5597', 'MAPK6');
    expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
    expect(await getNumNodes()).equal(1);
  });

  it('Make an edge between the two nodes', async function () {
    expect(await getNumEdges()).equal(0);
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    expect(await getNumEdges()).equal(1);
    let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(edge.type).equal('INTERACTION');
    expect(edge.properties.type).equal('phosphorylation');
    expect(edge.properties.sourceId).equal('ncbigene:5597');
    expect(edge.properties.targetId).equal('ncbigene:207');
    expect(edge.properties.xref).equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(edge.properties.doi).equal('10.1126/sciadv.abi6439');
    expect(edge.properties.pmid).equal('34767444');
    expect(edge.properties.articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

  it('Making a duplicate node fails', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    expect(await getNumNodes()).equal(2);
    await addNode('ncbigene:5597', 'MAPK6');
    await addNode('ncbigene:5597', 'This is a dummy name');
    expect(await getNumNodes()).equal(2);
    expect(await getGeneName('ncbigene:5597')).equal('MAPK6');
  });

  it('Making a duplicate edge fails', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    expect(await getNumEdges()).equal(1);
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'This is a dummy type',
      'nc7',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '3444',
      'MAPK6-AKT signaling ');
    expect(await getNumEdges()).equal(1);
    let edge = await getEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b');
    expect(edge.type).equal('INTERACTION');
    expect(edge.properties.type).equal('phosphorylation');
    expect(edge.properties.sourceId).equal('ncbigene:5597');
    expect(edge.properties.targetId).equal('ncbigene:207');
    expect(edge.properties.xref).equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(edge.properties.doi).equal('10.1126/sciadv.abi6439');
    expect(edge.properties.pmid).equal('34767444');
    expect(edge.properties.articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');
  });

  it('Ensure searchGeneById works as expected for MAPK6', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let mapk6Relationships = await getInteractions('ncbigene:5597');

    expect(mapk6Relationships.length).equal(1);
    expect(mapk6Relationships[0].type).equal('INTERACTION');
    expect(mapk6Relationships[0].properties.type).equal('phosphorylation');
    expect(mapk6Relationships[0].properties.sourceId).equal('ncbigene:5597');
    expect(mapk6Relationships[0].properties.targetId).equal('ncbigene:207');
    expect(mapk6Relationships[0].properties.xref).equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(mapk6Relationships[0].properties.doi).equal('10.1126/sciadv.abi6439');
    expect(mapk6Relationships[0].properties.pmid).equal('34767444');
    expect(mapk6Relationships[0].properties.articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let mapk6NeighbouringNodes = await getNeighbouringNodes('ncbigene:5597');

    expect(mapk6NeighbouringNodes.length).equal(1);
    expect(mapk6NeighbouringNodes[0].labels[0]).equal('Gene');
    expect(mapk6NeighbouringNodes[0].properties.id).equal('ncbigene:207');
    expect(mapk6NeighbouringNodes[0].properties.name).equal('AKT');
  });

  it('Ensure searchGeneById works as expected for AKT', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let aktRelationships = await getInteractions('ncbigene:207');

    expect(aktRelationships.length).equal(1);
    expect(aktRelationships[0].type).equal('INTERACTION');
    expect(aktRelationships[0].properties.type).equal('phosphorylation');
    expect(aktRelationships[0].properties.sourceId).equal('ncbigene:5597');
    expect(aktRelationships[0].properties.targetId).equal('ncbigene:207');
    expect(aktRelationships[0].properties.xref).equal('a896d611-affe-4b45-a5e1-9bc560ffceab');
    expect(aktRelationships[0].properties.doi).equal('10.1126/sciadv.abi6439');
    expect(aktRelationships[0].properties.pmid).equal('34767444');
    expect(aktRelationships[0].properties.articleTitle).equal('MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let aktNeighbouringNodes = await getNeighbouringNodes('ncbigene:207');

    expect(aktNeighbouringNodes.length).equal(1);
    expect(aktNeighbouringNodes[0].labels[0]).equal('Gene');
    expect(aktNeighbouringNodes[0].properties.id).equal('ncbigene:5597');
    expect(aktNeighbouringNodes[0].properties.name).equal('MAPK6');
  });

  it('Search for a gene in an empty database yields empty array', async function () {
    let nonexistent = await searchByGeneId('ncbigene:207');
    expect(nonexistent.length).equal(0);
    nonexistent = await getInteractions('ncbigene:207');
    expect(nonexistent.length).equal(0);
    nonexistent = await getNeighbouringNodes('ncbigene:207');
    expect(nonexistent.length).equal(0);
  });

  it('Search for a non-existing gene in a non-empty database yields empty array', async function () {
    await addNode('ncbigene:207', 'AKT');
    await addNode('ncbigene:5597', 'MAPK6');
    await addEdge('01ef22cc-2a8e-46d4-9060-6bf1c273869b',
      'phosphorylation',
      'ncbigene:5597',
      'ncbigene:207',
      'a896d611-affe-4b45-a5e1-9bc560ffceab',
      '10.1126/sciadv.abi6439',
      '34767444',
      'MAPK6-AKT signaling promotes tumor growth and resistance to mTOR kinase blockade.');

    let nonexistent = await searchByGeneId('ncbigene:217');
    expect(nonexistent.length).equal(0);
    nonexistent = await getInteractions('ncbigene:217');
    expect(nonexistent.length).equal(0);
    nonexistent = await getNeighbouringNodes('ncbigene:217');
    expect(nonexistent.length).equal(0);
  });

});