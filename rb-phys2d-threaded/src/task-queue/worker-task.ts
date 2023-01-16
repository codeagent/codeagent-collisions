export interface WorkerMessage {
  readonly name: string;
}

export interface WorkerTask extends WorkerMessage {
  readonly taskId?: number;
}

export interface WorkerTaskResult<
  T extends WorkerTask = WorkerTask,
  R = unknown
> extends WorkerMessage {
  readonly task: T;
  readonly result?: R;
  readonly timestamp: number;
  readonly error?: unknown;
}

export const isTask = (message: WorkerMessage): message is WorkerTask =>
  message && 'taskId' in message;

export const isTaskResult = (
  message: WorkerMessage
): message is WorkerTaskResult =>
  message && ('result' in message || 'error' in message);

export const isSuccess = (result: WorkerTaskResult): boolean =>
  'result' in result;

export const isFail = (result: WorkerTaskResult): boolean => 'error' in result;
