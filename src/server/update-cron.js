import documentUpdate from './routes/api/document/update';

import { DOCUMENT_CRON_UPDATE_PERIOD_DAYS } from '../config';

const updateCron = async () => {
  await documentUpdate( DOCUMENT_CRON_UPDATE_PERIOD_DAYS );
};

export default updateCron;