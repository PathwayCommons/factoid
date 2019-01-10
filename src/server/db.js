let r = require('rethinkdb');
let fs = require('fs');
let config = require('../config');

let db = {
  connect: function(){
    if( this.conn ){
      return Promise.resolve( this.conn );
    } else {
      return r.connect({
        host: config.DB_HOST,
        port: config.DB_PORT,
        db: config.DB_NAME,
        user: config.DB_USER,
        password: config.DB_PASS,
        ssl: config.DB_CERT ? {
          ca: fs.readFileSync( config.DB_CERT )
        } : undefined
      }).then( conn => {
        this.conn = conn;

        return conn;
      } );
    }
  },

  reconnectOnClose: function( doConnect ){
    let shouldRec = this.shouldReconnectOnClose = doConnect;

    if( !this.preparedForClose ){
      this.preparedForClose = true;

      let reconnect = () => this.conn.reconnect({ noreplyWait: false }).run();
      let keepTrying = () => reconnect().catch( keepTrying );

      this.conn.on('close', function(){
        if( shouldRec ){
          reconnect().catch( keepTrying );
        }
      });
    }
  },

  guaranteeTable: function( tableName ){
    return this.connect().then( () => {
      return this.guaranteeDb();
    }).then( () => {
      return this.db.tableList().run( this.conn );
    } ).then( tables => {
      if( !tables.includes( tableName ) ){
        return this.db.tableCreate( tableName ).run( this.conn );
      } else {
        return Promise.resolve();
      }
    } ).then( () => {
      return this.db.table( tableName );
    } );
  },

  guaranteeDb: function(){
    if( this.db ){
      return Promise.resolve( this.db );
    }

    return this.connect().then( () => {
      return r.dbList().run( this.conn );
    } ).then( dbs => {
      if( !dbs.includes( config.DB_NAME ) ){
        return r.dbCreate( config.DB_NAME ).run( this.conn );
      } else {
        return Promise.resolve();
      }
    } ).then( () => {
      this.db = r.db( config.DB_NAME );

      return this.db;
    } );
  },

  accessTable: function( tableName ){
    return this.guaranteeTable( tableName ).then( table => {
      return {
        rethink: r,
        conn: this.conn,
        db: this.db,
        table: table
      };
    } );
  }
};

module.exports = db;
