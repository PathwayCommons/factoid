import update from './routes/api/document/update';

const updateCron = async () => {
  await update();
};

export default updateCron;