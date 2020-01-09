import Express from 'express';
import ElementAssociation from './element-association';
import Document from './document';

let http = Express.Router();

http.use('/element-association', ElementAssociation);
http.use('/document', Document);

export default http;
