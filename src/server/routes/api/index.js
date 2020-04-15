import Express from 'express';
import ElementAssociation from './element-association';
import Document from './document';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { EMAIL_ADDRESS_INFO, BASE_URL } from '../../../config';

let http = Express.Router();

const swaggerOpts = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biofactoid web services',
      contact: {
        name: 'Biofactoid',
        url: BASE_URL,
        email: EMAIL_ADDRESS_INFO
      },
      version: `${process.env.npm_package_version}`,
    },
  },
  apis: [
    './src/server/routes/api/**/*.js'
  ]
};

const swaggerDocument = swaggerJSDoc( swaggerOpts );

http.get('/api-docs', swaggerUi.setup( swaggerDocument ));
http.use('/api-docs', swaggerUi.serve);

http.use('/element-association', ElementAssociation);
http.use('/document', Document);

export default http;
