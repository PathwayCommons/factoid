const MODS = Object.freeze( (() => {
  let mods = {};

  let map = {
    UNMODIFIED: 'unmodified',
    PHOSPHORYLATED: 'phosphorylated',
    METHYLATED: 'methylated',
    UBIQUINATED: 'ubiquinated'
  };

  Object.keys( map ).forEach( key => {
    let value = map[key];
    let displayValue = value[0].toUpperCase() + value.substr(1);

    mods[key] = Object.freeze({ value, displayValue });
  } );

  return mods;
})() );

const ORDERED_MODS = Object.freeze( [
  MODS.UNMODIFIED,
  MODS.PHOSPHORYLATED,
  MODS.METHYLATED,
  MODS.UBIQUINATED
] );

const getModByValue = function( value ){
  let key = Object.keys( MODS ).filter( key => MODS[key].value === value );

  return MODS[key] || MODS.UNMODIFIED;
};

module.exports = { MODS, ORDERED_MODS, getModByValue };
