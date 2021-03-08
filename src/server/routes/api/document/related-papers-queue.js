import {default as PQueue} from 'p-queue';
import delay from 'delay';

const pcQueue = new PQueue({concurrency: 1});
const adminQueue = new PQueue({concurrency: 1});

const addJob = async (relPprsFcn, queue) => {
  await queue.add(() => relPprsFcn().then( () => delay( 500 ) ));
  return Promise.resolve();
};

class AdminPapersQueue {
  static async addJob(relPprsFcn){
    await addJob( relPprsFcn, adminQueue );
    return Promise.resolve();
  }
}

class PCPapersQueue {
  static async addJob(relPprsFcn){
    await addJob( relPprsFcn, pcQueue );
    return Promise.resolve();
  }
}

export { AdminPapersQueue, PCPapersQueue };
