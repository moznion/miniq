export class QueueTaskRunner<T> {
  private queuedTasks: Task<T>[] = [];
  private isRunning = false;

  enqueue(task: Task<T>): void {
    this.queuedTasks.push(task);
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    (async () => {
      for (;;) {
        const nextTask = this.queuedTasks.shift();
        if (nextTask === undefined) {
          this.isRunning = false;
          return;
        }
        await nextTask.do();
      }
    })();
  }
}

export class Task<T> {
  private constructor(
    private readonly func: () => Promise<T>,
    private readonly resolve: (value: T | PromiseLike<T>) => void,
    private readonly reject: (reason?: unknown) => void,
    private readonly resultPromise: Promise<T>,
    private readonly ttlEpochMillisec?: number,
  ) {}

  static async make<T>(func: () => Promise<T>, ttlEpochMillisec?: number): Promise<Task<T>> {
    return await new Promise<Task<T>>(resolveTaskSetup => {
      let resultPromise: Promise<T>;
      let resolve: (value: T | PromiseLike<T>) => void;
      let reject: (reason?: unknown) => void;

      new Promise<void>(resolveNotifierSetup => {
        resultPromise = new Promise<T>((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
          resolveNotifierSetup();
        });
      }).then(() => {
        resolveTaskSetup(new Task<T>(func, resolve, reject, resultPromise, ttlEpochMillisec));
      });
    });
  }

  async do(): Promise<void> {
    try {
      if (this.ttlEpochMillisec !== undefined && this.ttlEpochMillisec < Date.now()) {
        this.reject(new TaskTTLExceededError('the ttl of queued task has exceeded'));
        return;
      }

      const result = await this.func();
      this.resolve(result);
    } catch (e: unknown) {
      this.reject(e);
    }
  }

  async getResult(): Promise<T> {
    return this.resultPromise;
  }
}

export class TaskTTLExceededError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, TaskTTLExceededError.prototype);
  }
}
