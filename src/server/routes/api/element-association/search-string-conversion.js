const convert = str => {
  return (
    str
      .replace(/sulph/gi, 'sulf')
      .replace(/aluminium/gi, 'aluminum')
  );
};

export default convert;
