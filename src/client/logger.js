import { LOG_LEVEL } from '../config';

const LEVELS = Object.freeze({
  info: 0,
  warn: 1,
  error: 2,
  none: 3
});

let log = function( min, lvl, ...args ){
  let i = LEVELS[ lvl ];
  let n = LEVELS[ min ];

  if( i >= n ){
    console[ lvl ].call( console, ...args ); // eslint-disable-line no-console
  }
};

let toMs = date => (date).valueOf();

class Logger {
  constructor( options ){
    options = options || {};

    this.minLevel = options.minLevel || 'info';
    this.history = [];
    this.maxEntries = options.maxEntries || Infinity;
  }

  at( index ){
    let entry = this.history[ index ];

    log( this.minLevel, entry.level, ...entry.args );
  }

  where( match ){
    let hist = this.history;

    for( let i = 0; i < hist.length; i++ ){
      let entry = hist[i];

      if( match( entry, i ) ){
        log( this.minLevel, entry.level, ...entry.args );
      }
    }
  }

  first( n ){
    this.where( (ent, i) => i < n );
  }

  last( n ){
    this.where( (ent, i) => i > this.history.length - 1 - n );
  }

  before( date ){
    date = toMs( date );

    this.where( ent => ent.date <= date );
  }

  after( date ){
    date = toMs( date );

    this.where( ent => ent.date >= date );
  }

  all(){
    this.where( () => true );
  }

  clear(){
    this.history.splice( 0, this.history.length );
  }

  shift(){
    let hist = this.history;

    hist.splice( 0, hist.length - this.maxEntries );
  }

  static get LEVELS(){ return LEVELS; }
}

Object.keys( LEVELS ).forEach( lvl => {
  if( lvl === 'none' ){ return; }

  Logger.prototype[lvl] = function( ...args ){
    log( this.minLevel, lvl, ...args );

    let hist = this.history;

    hist.push({
      date: Date.now(),
      args: args,
      level: lvl,
      levelCode: LEVELS[ lvl ]
    });

    if( hist.length > this.maxEntries ){
      this.shift();
    }
  };
});

export default new Logger({ minLevel: LOG_LEVEL, maxEntries: 10 });
