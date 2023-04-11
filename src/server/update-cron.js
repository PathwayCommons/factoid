import documentUpdate from './routes/api/document/update';
import { refreshGraphDB } from './routes/api/document/graphdb';

import {
  DOCUMENT_CRON_UPDATE_PERIOD_DAYS,
  GRAPHDB_CRON_UPDATE_PERIOD_MINUTES
} from '../config';

const updateCron = async () => {
  await documentUpdate( DOCUMENT_CRON_UPDATE_PERIOD_DAYS );
  await refreshGraphDB( GRAPHDB_CRON_UPDATE_PERIOD_MINUTES );
};

export default updateCron;