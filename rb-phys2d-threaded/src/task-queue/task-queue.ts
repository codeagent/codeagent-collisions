import { WorkerTask, WorkerTaskResult, isTaskResult } from './worker-task';

export interface TaskQueueEntry {
  task: WorkerTask;
  onTaskResult?(task: WorkerTaskResult): void;
  transfer?: Transferable[];
}

export class TaskQueue {
  private taskCounter = 0;

  private readonly queue: TaskQueueEntry[] = [];

  constructor(private readonly worker: Worker) {
    this.worker.addEventListener('message', event => this.onMessage(event));
  }

  enqueue(
    task: WorkerTask,
    transfer?: Transferable[],
    onTaskResult?: (task: WorkerTaskResult) => void
  ): void {
    Object.assign(task, { taskId: ++this.taskCounter });

    if (this.queue.length === 0) {
      this.worker.postMessage(task, transfer);
    }

    this.queue.push({ task, transfer, onTaskResult });
  }

  private onMessage<T extends WorkerTask>(
    event: MessageEvent<WorkerTaskResult<T>>
  ): void {
    if (isTaskResult(event.data)) {
      if (this.queue.length === 0) {
        console.error('TaskQueue.onMessage: task queue is empty');
        return;
      }

      if (this.queue[0].task.taskId !== event.data.task.taskId) {
        console.error(
          `TaskQueue.onMessage: task from queue: ${this.queue[0].task.taskId}, result from task: ${event.data.task.taskId}`
        );
        return;
      }

      const task = this.queue.shift();

      if (task.onTaskResult) {
        task.onTaskResult(event.data);
      }

      if (this.queue.length > 0) {
        this.worker.postMessage(this.queue[0].task);
      }
    }
  }
}
