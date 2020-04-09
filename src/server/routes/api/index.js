import Express from 'express';
import ElementAssociation from './element-association';
import Document from './document';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

let http = Express.Router();

const options = {
  definition: {
    info: {
      title: 'Factoid web services', // Title (required)
      version: '1.0.0', // Version (required)
    },
  },
  // Path to the API docs
  apis: [
    './src/server/routes/api/**/*.js'
  ]
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerDocument = swaggerJSDoc( options );

http.use('/api-docs', swaggerUi.serve);
http.get('/api-docs', swaggerUi.setup( swaggerDocument ));

http.use('/element-association', ElementAssociation);
http.use('/document', Document);

export default http;
