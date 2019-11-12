import express from 'express';
import { getDocumentJson } from './api/document';
import { TWITTER_ACCOUNT_NAME } from '../../config';

const http = express.Router();
const twitterAccount = TWITTER_ACCOUNT_NAME;

// get the app ui but with static share metadata in the html
const getDocumentPage = function(req, res) {
  ( getDocumentJson(req.params.id)
    .then(document => res.render('index.html.ejs', { document, twitterAccount }))
  );
};

http.get('/document/:id/:secret', getDocumentPage);
http.get('/document/:id', getDocumentPage);

// get the app ui
http.get('*', function(req, res) {
  res.render('index.html.ejs');
});

export default http;
