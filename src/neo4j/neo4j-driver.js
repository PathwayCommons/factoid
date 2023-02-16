import neo4j from 'neo4j-driver';
import { GRAPHDB_CONN, GRAPHDB_USER, GRAPHDB_PASS } from '../config';

let driver;

/**
 * Initialize the Neo4j driver singleton
 *
 * @returns Promise<Neo4j driver>
 */
export async function initDriver() {
  driver = neo4j.driver( GRAPHDB_CONN,
    neo4j.auth.basic( GRAPHDB_USER, GRAPHDB_PASS )
  );
  await driver.verifyConnectivity();
  return driver;
}

/**
 * Retrieve the Neo4j driver instance
 *
 * @returns Neo4j driver instance or undefined
 */
export function getDriver() {
  return driver;
}

/**
 * Close the Neo4j driver instance
 *
 * @returns Promise<void>
 */
export async function closeDriver() {
  return driver && driver.close();
}
