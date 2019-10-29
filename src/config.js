import _ from 'lodash';
import { isClient } from './util';

const env = (key, defaultVal) => {
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

export const PORT = env('PORT', 3000);

export const LOG_LEVEL = env('LOG_LEVEL', 'info');

export const API_KEY = env('API_KEY', '');

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
export const REACH_URL = env('REACH_URL', 'http://reach.baderlab.org/api/uploadFile');
export const BIOPAX_CONVERTER_URL = env('BIOPAX_CONVERTER_URL', 'https://biopax.baderlab.org/convert/v2/');
export const GROUNDING_SEARCH_BASE_URL = env('GROUNDING_SEARCH_BASE_URL', 'https://grounding.baderlab.org');

// Links
export const UNIPROT_LINK_BASE_URL = env('UNIPROT_LINK_BASE_URL', 'http://www.uniprot.org/uniprot/');
export const CHEBI_LINK_BASE_URL = env('CHEBI_LINK_BASE_URL', 'https://www.ebi.ac.uk/chebi/searchId.do?chebiId=');
export const PUBCHEM_LINK_BASE_URL = env('PUBCHEM_LINK_BASE_URL', 'https://pubchem.ncbi.nlm.nih.gov/compound/');
export const NCBI_LINK_BASE_URL = env('NCBI_LINK_BASE_URL', 'https://www.ncbi.nlm.nih.gov/gene/');
export const PUBMED_LINK_BASE_URL = env('PUBMED_LINK_BASE_URL', 'https://www.ncbi.nlm.nih.gov/pubmed/');

// Email
export const EMAIL_ENABLED = env('EMAIL_ENABLED', false);
export const EMAIL_FROM = env('EMAIL_FROM', 'Biofactoid');
export const EMAIL_FROM_ADDR = env('EMAIL_FROM_ADDR', 'support@biofactoid.org');
export const SMTP_PORT = env('SMTP_PORT', 587);
export const SMTP_HOST = env('SMTP_HOST', 'localhost');
export const SMTP_USER = env('SMTP_USER', 'user');
export const SMTP_PASSWORD = env('SMTP_PASSWORD', 'password');

export const EMAIL_VENDOR_MAILJET = env('EMAIL_VENDOR_MAILJET', 'Mailjet');
export const INVITE_TMPLID = env('INVITE_SIGNUP_TMPLID', '1005099');
export const SUBMIT_SUCCESS_TMPLID = env('SUBMIT_SUCCESS_TMPLID', '988309');
export const EMAIL_CONTEXT_JOURNAL = env('EMAIL_CONTEXT_JOURNAL', 'journal');
export const EMAIL_CONTEXT_SIGNUP = env('EMAIL_CONTEXT_SIGNUP', 'signup');

// client vars:
// these vars are always included in the bundle because they ref `process.env.${name}` directly
// NB DO NOT include passwords etc. here
export const NODE_ENV = env('NODE_ENV', undefined);
export const PC_URL = env('PC_URL', 'https://apps.pathwaycommons.org/');
export const BASE_URL = env('BASE_URL', 'https://factoid.baderlab.org');
export const DEMO_ID = env('DEMO_ID', 'demo');
export const DEMO_SECRET = env('DEMO_SECRET', 'demo');
export const DEMO_JOURNAL_NAME = env('DEMO_JOURNAL_NAME', 'Journal of Example');
export const DEMO_AUTHOR = env('DEMO_AUTHOR', 'John Doe');
export const DEMO_TITLE = env('DEMO_TITLE', 'Lorem ipsum dolor sit amet');
