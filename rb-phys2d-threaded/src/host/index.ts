import 'reflect-metadata';

import { WorkerMessage, isTask } from '../task-queue';

import { TaskWorker } from './task-worker';

const worker = new TaskWorker();

self.addEventListener(
  'message',
  <T extends WorkerMessage>(e: MessageEvent<T>) => {
    const message = e.data;

    if (isTask(message)) {
      const taskResult = worker.processTask(message);

      if (taskResult) {
        self.postMessage(taskResult);
      }
    }
  }
);
