import Express from 'express';

let http = Express.Router();

http.use('/element-association', require('./element-association'));
http.use('/document', require('./document'));

export default http;
