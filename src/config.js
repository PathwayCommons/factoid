import _ from 'lodash';
import { isClient } from './util';
import clientVars from './client-env-vars.json';

const env = (key, defaultVal) => {
  if( isClient() && clientVars.indexOf(key) < 0 ){
    return (`Can not use env var '${key}' on client because it is not defined in 'client-env-vars.json'`);
  }

  if( process.env[key] != null ){
    let val =  process.env[key];

    if( _.isInteger(defaultVal) ){
      val = parseInt(val);
    }
    else if( _.isBoolean(defaultVal) ){
      val = JSON.parse(val);
    }

    return val;
  } else {
    return defaultVal;
  }
};

export const NODE_ENV = env('NODE_ENV', undefined);

export const BASE_URL = env('BASE_URL', 'https://biofactoid.org');

export const PORT = env('PORT', 3000);

export const LOG_LEVEL = env('LOG_LEVEL', 'info');

export const API_KEY = env('API_KEY', '');

// CRON jobs
export const CRON_SCHEDULE = env('CRON_SCHEDULE', '0 1 * * *');
export const DOCUMENT_CRON_UPDATE_PERIOD_DAYS = env('DOCUMENT_CRON_UPDATE_PERIOD_DAYS', 7);
export const DOCUMENT_CRON_CREATED_AGE_DAYS = env('DOCUMENT_CRON_CREATED_AGE_DAYS', undefined);
export const DOCUMENT_CRON_REFRESH_ENABLED = env('DOCUMENT_CRON_REFRESH_ENABLED', true);

// Connect to localhost
export const SOCKET_HOST = env('SOCKET_HOST', isClient() ? window.location.hostname : 'localhost');

// Use localhost db with no auth by default (default rethink config).
export const DB_NAME = env('DB_NAME', 'factoid');
export const DB_HOST = env('DB_HOST', 'localhost');
export const DB_PORT = env('DB_PORT', 28015);
export const DB_USER = env('DB_USER', undefined); // username if db uses auth
export const DB_PASS = env('DB_PASS', undefined); // password if db uses auth
export const DB_CERT = env('DB_CERT', undefined);  // path to a certificate (cert) file if db uses ssl

// Services
export const PC_URL = env('PC_URL', 'https://apps.pathwaycommons.org/');
export const REACH_URL = env('REACH_URL', 'http://reach.baderlab.org/api/uploadFile');
export const BIOPAX_CONVERTER_URL = env('BIOPAX_CONVERTER_URL', 'https://biopax.baderlab.org/convert/v2/');
//
// TODO PUT THIS BACK TO THE PROPER VALUE -- master only for convenient testing
export const GROUNDING_SEARCH_BASE_URL = env('GROUNDING_SEARCH_BASE_URL', 'https://master.grounding.baderlab.org');
//
export const NCBI_EUTILS_BASE_URL = env('NCBI_EUTILS_BASE_URL', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/');
export const NCBI_EUTILS_API_KEY = env('NCBI_EUTILS_API_KEY', 'b99e10ebe0f90d815a7a99f18403aab08008');
export const INDRA_DB_BASE_URL = env('INDRA_DB_BASE_URL', 'https://db.indra.bio/latest/');
export const INDRA_ENGLISH_ASSEMBLER_URL = env('INDRA_ENGLISH_ASSEMBLER_URL', 'http://api.indra.bio:8000/assemblers/english');
export const SEMANTIC_SEARCH_BASE_URL = env('SEMANTIC_SEARCH_BASE_URL', 'https://semanticsearch.baderlab.org/');

// Links
export const UNIPROT_LINK_BASE_URL = env('UNIPROT_LINK_BASE_URL', 'http://www.uniprot.org/uniprot/');
export const CHEBI_LINK_BASE_URL = env('CHEBI_LINK_BASE_URL', 'https://www.ebi.ac.uk/chebi/searchId.do?chebiId=');
export const PUBCHEM_LINK_BASE_URL = env('PUBCHEM_LINK_BASE_URL', 'https://pubchem.ncbi.nlm.nih.gov/compound/');
export const NCBI_LINK_BASE_URL = env('NCBI_LINK_BASE_URL', 'https://www.ncbi.nlm.nih.gov/gene/');
export const PUBMED_LINK_BASE_URL = env('PUBMED_LINK_BASE_URL', 'https://pubmed.ncbi.nlm.nih.gov/');
export const DOI_LINK_BASE_URL = env('DOI_LINK_BASE_URL', 'https://www.doi.org/');
export const GOOGLE_SCHOLAR_BASE_URL = env('GOOGLE_SCHOLAR_BASE_URL', 'https://scholar.google.com/scholar?q=');

// Email
export const EMAIL_ENABLED = env('EMAIL_ENABLED', false);
export const EMAIL_FROM = env('EMAIL_FROM', 'Biofactoid');
export const EMAIL_FROM_ADDR = env('EMAIL_FROM_ADDR', 'support@biofactoid.org');
export const SMTP_PORT = env('SMTP_PORT', 587);
export const SMTP_HOST = env('SMTP_HOST', 'localhost');
export const SMTP_USER = env('SMTP_USER', 'user');
export const SMTP_PASSWORD = env('SMTP_PASSWORD', 'password');

export const EMAIL_VENDOR_MAILJET = env('EMAIL_VENDOR_MAILJET', 'Mailjet');
export const MAILJET_TMPLID_INVITE = env('MAILJET_TMPLID_INVITE', '1330760');
export const MAILJET_TMPLID_FOLLOWUP = env('MAILJET_TMPLID_FOLLOWUP', '988309');
export const MAILJET_TMPLID_REQUEST_ISSUE = env('MAILJET_TMPLID_REQUEST_ISSUE', '1202251');
export const EMAIL_TYPE_INVITE = env('EMAIL_TYPE_INVITE', 'invite');
export const EMAIL_TYPE_FOLLOWUP = env('EMAIL_TYPE_FOLLOWUP', 'followUp');
export const EMAIL_TYPE_REQUEST_ISSUE = env('EMAIL_TYPE_REQUEST_ISSUE', 'requestIssue');
export const EMAIL_ADDRESS_INFO = env('EMAIL_ADDRESS_INFO', 'info@biofactoid.org');

// Sharing
export const DOCUMENT_IMAGE_CACHE_SIZE = env('DOCUMENT_IMAGE_CACHE_SIZE', 100);
export const DOCUMENT_IMAGE_WIDTH = env('DOCUMENT_IMAGE_WIDTH', 2400);
export const DOCUMENT_IMAGE_HEIGHT = env('DOCUMENT_IMAGE_HEIGHT', 1200);
export const DOCUMENT_IMAGE_PADDING = env('DOCUMENT_IMAGE_PADDING', 50);
export const TWITTER_CONSUMER_KEY = env('TWITTER_CONSUMER_KEY', 'SPECIFY_IN_YOUR_ENV');
export const TWITTER_CONSUMER_SECRET = env('TWITTER_CONSUMER_SECRET', 'SPECIFY_IN_YOUR_ENV');
export const TWITTER_ACCESS_TOKEN_KEY = env('TWITTER_ACCESS_TOKEN_KEY', 'SPECIFY_IN_YOUR_ENV');
export const TWITTER_ACCESS_TOKEN_SECRET = env('TWITTER_ACCESS_TOKEN_SECRET', 'SPECIFY_IN_YOUR_ENV');
export const TWITTER_ACCOUNT_NAME = env('TWITTER_ACCOUNT_NAME', 'biofactoid');
export const MAX_TWEET_LENGTH = env('MAX_TWEET_LENGTH', 150);

// Demo and sample
export const DEMO_ID = env('DEMO_ID', 'demo');
export const DEMO_SECRET = env('DEMO_SECRET', 'demo');
export const DEMO_AUTHOR_EMAIL = env('DEMO_AUTHOR_EMAIL', 'author@example.com');
export const DEMO_CAN_BE_SHARED = env('DEMO_CAN_BE_SHARED', false);
export const DEMO_CAN_BE_SHARED_MULTIPLE_TIMES = env('DEMO_CAN_BE_SHARED_MULTIPLE_TIMES', false);
export const SAMPLE_DOC_ID = env('SAMPLE_DOC_ID', '5df17c41-acb7-4c42-a37b-fe323688bc64');

export const NO_ABSTRACT_HANDLING = env('NO_ABSTRACT_HANDLING', 'text');

