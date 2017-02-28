var rdb = require('rethinkdb');

const DB_NAME = 'factoid_test';

class TableUtil {

  constructor( name ){
    this.name = name;
  }

  get rethink(){
    return rdb;
  }

  connect( done ){
    if( this.conn ){
      done();

      return;
    }

    rdb.connect({ host: 'localhost', port: 28015 }, ( err, connection ) => {
      if( err ){ throw err; }

      this.conn = connection;

      done();
    });
  }

  get table(){
    return rdb.db( DB_NAME ).table( this.name );
  }

  clean( done ){
    this.connect( () => {
      rdb.dbDrop( DB_NAME ).run( this.conn, ( err, res ) => {
        done();
      } ).catch( () => {} );
    } );
  }

  drop( done ){
    rdb.dbDrop( DB_NAME ).run( this.conn, ( err, res ) => {
      if( err ){ throw err; }

      this.conn.close(( err ) => {
        if( err ){ throw err; }

        done();
      });
    } );
  }

  create( done ){
    let createDb = ( next ) => {
      rdb.dbCreate( DB_NAME ).run( this.conn, ( err, res ) => {
        if( err ){ throw err; }

        next();
      } );
    };

    let checkDbExists = fn => {
      rdb.db( DB_NAME ).tableList().run( this.conn, ( err, res ) => {
        if( err ){
          fn( false );
        } else {
          fn( true );
        }
      } );
    };

    let createTable = next => {
      rdb.db( DB_NAME ).tableCreate( this.name ).run( this.conn, ( err, res ) => {
        if( err ){ throw err; }

        next();
      } );
    };

    this.connect(() => {
      checkDbExists( ( exists ) => {
        if( exists ){
          createTable( done );
        } else {
          createDb( () => createTable( done ) );
        }
      } );
    });
  }

  deleteEntry( id, done ){
    rdb.db( DB_NAME ).table( this.name ).get( id ).delete().run( this.conn, ( err, res ) => {
      if( err ){ throw err; }

      done();
    } );
  }


}

module.exports = TableUtil;
