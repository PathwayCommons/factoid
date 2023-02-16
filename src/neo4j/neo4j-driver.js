import neo4j from 'neo4j-driver';
import { GRAPHDB_CONN, GRAPHDB_USER, GRAPHDB_PASS } from '../config';

let driver;

/**
 * Initialize the Neo4j driver singleton
 *
 * @param {object} config additional configuration
 * @returns Promise resolving to Neo4j {@link https://neo4j.com/docs/api/javascript-driver/current/class/lib6/driver.js~Driver.html Driver} instance
 */
export async function initDriver( config = {} ) {
  driver = neo4j.driver( GRAPHDB_CONN,
    neo4j.auth.basic( GRAPHDB_USER, GRAPHDB_PASS ),
    config
  );
  return driver;
}

/**
 * Retrieve the Neo4j driver instance, create if not exists
 *
 * @returns Promise resolving to Neo4j Driver instance
 */
export async function getDriver() {
  if( !driver ){
    await initDriver();
  } else {
    return driver;
  }
}

/**
 * Close the Neo4j driver instance
 *
 * @returns Promise<void>
 */
export async function closeDriver() {
  return driver && driver.close();
}
