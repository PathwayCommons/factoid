import docUpdate from './routes/api/document/update';

const updateCron = async () => {
  await docUpdate();
};

export default updateCron;