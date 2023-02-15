import neo4j from 'neo4j-driver';

let driver;

export function initDriver() {
    driver = neo4j.driver('bolt://localhost:7687');
    return driver.verifyConnectivity()
    .then( () => driver);
}

export function getDriver() {
    return driver;
}

export function closeDriver() {
    return driver && driver.close();
}
