import winston from 'winston';
import * as config from '../config';

let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: config.LOG_LEVEL }),
    new (winston.transports.File)({ name: 'debug', filename: 'debug.log', level: 'debug' }),
    new (winston.transports.File)({ name: 'warn', filename: 'warn.log', level: 'warn' }),
    new (winston.transports.File)({ name: 'error', filename: 'error.log', level: 'error' })
  ]
});

logger.cli();

export default logger;
