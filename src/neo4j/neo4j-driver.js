import neo4j from 'neo4j-driver';
import { GRAPHDB_CONN, GRAPHDB_USER, GRAPHDB_PASS, GRAPHDB_DBNAME } from '../config.js';
const DEFAULT_SESSION_CONFIG = { database: GRAPHDB_DBNAME };

let driver;

/**
 * Initialize the Neo4j driver singleton
 *
 * @param {object} config additional configuration
 * @returns Neo4j {@link https://neo4j.com/docs/api/javascript-driver/current/class/lib6/driver.js~Driver.html Driver} instance
 */
export function initDriver( config = {} ) {
  driver = neo4j.driver( GRAPHDB_CONN,
    neo4j.auth.basic( GRAPHDB_USER, GRAPHDB_PASS ),
    config
  );
  return driver;
}

/**
 * Retrieve the Neo4j driver instance
 *
 * @returns The Neo4j Driver instance
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

/**
 * Convenience function for accessing a session
 *
 * @param {object} sessionConfig additional configuration
 * @returns A neo4j driver {@link https://neo4j.com/docs/api/javascript-driver/current/class/lib6/session.js~Session.html Session} instance
 */
export function guaranteeSession( sessionConfig = DEFAULT_SESSION_CONFIG ) {
  if ( !driver ) initDriver();
  return driver.session( sessionConfig );
}
