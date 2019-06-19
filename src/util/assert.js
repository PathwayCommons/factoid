import error from './obj';

function assert( condition, message ){
  if( !condition ){
    throw( error( message || 'An assertion failed' ) );
  }
}

function assertDefined( val, name ){
  assert( val != null, `Expected '${name}' to be defined` );
}

function assertFieldDefined( obj, field ){
  assertDefined( obj[ field ], field );
}

function assertFieldsDefined( obj, fields ){
  fields.forEach( field => assertFieldDefined( obj, field ) );
}

function assertOneOfFieldsDefined( obj, fields ){
  assert(
    fields.some( f => obj[f] != null ),
    'Expected at least one of ' + fields.map( f => `'${f}'` ).join(', ') + ' to be defined'
  );
}

export {
  assert,
  assertDefined,
  assertFieldDefined,
  assertFieldsDefined,
  assertOneOfFieldsDefined
};
