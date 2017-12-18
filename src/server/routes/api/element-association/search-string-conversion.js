const convert = str => {
  return (
    str
      .replace(/sulph/gi, 'sulf')
  );
};

module.exports = convert;
