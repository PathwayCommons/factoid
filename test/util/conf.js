import Promise from 'bluebird';

Promise.config({
  warnings: true,
  longStackTraces: true
});

export const defaultTimeout = 5000;
