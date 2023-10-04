import documentUpdate from './routes/api/document/update';
import { refreshGraphDB } from './routes/api/document/graphdb';

import {
  GRAPHDB_CRON_REFRESH_PERIOD_MINUTES
} from '../config';

const updateCron = async () => {
  await documentUpdate();
  await refreshGraphDB( GRAPHDB_CRON_REFRESH_PERIOD_MINUTES );
};

export default updateCron;