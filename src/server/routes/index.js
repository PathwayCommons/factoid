import express from 'express';
import { generateSitemap, getDocumentJson } from './api/document';
import { TWITTER_ACCOUNT_NAME, BASE_URL, EMAIL_ADDRESS_INFO, NODE_ENV, GA_ID } from '../../config';

const http = express.Router();

// get the app ui but with static share metadata in the html
const getDocumentPage = function(req, res) {
  ( getDocumentJson(req.params.id)
    .then(document => res.render('index.html.ejs', {
      document,
      TWITTER_ACCOUNT_NAME,
      BASE_URL,
      NODE_ENV,
      GA_ID
    }))
    .catch( () => res.render( '404', { EMAIL_ADDRESS_INFO } ) )
  );
};

http.get('/robots.txt', function( req, res ) {
  res.set('Content-Type', 'text/plain');
  const text = `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml`;
  res.send( text );
});

http.get('/sitemap.xml', function( req, res, next ) {
  res.set('Content-Type', 'application/xml');
  generateSitemap()
    .then( sitemap => res.send( sitemap ) )
    .catch( next );
});

http.get('/document/:id/:secret', getDocumentPage);
http.get('/document/:id', getDocumentPage);

// get the app ui
http.get('*', function(req, res) {
  res.render('index.html.ejs', {
    TWITTER_ACCOUNT_NAME,
    BASE_URL,
    NODE_ENV,
    GA_ID
  });
});

export default http;
