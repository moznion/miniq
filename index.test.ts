import { describe, expect, test } from '@jest/globals';
import { QueueTaskRunner, Task, TaskTTLExceededError } from './index';

describe('QueueTaskRunner', () => {
  test('execute a single task (i.e. no queieing)', async () => {
    const queueTaskRunner = new QueueTaskRunner<string>();
    const task = await Task.make<string>(async (): Promise<string> => {
      return 'foo';
    });
    queueTaskRunner.execOrQueue(task);

    const result = await task.getResult();
    expect(result).toBe('foo');
  });

  test('execute multiple tasks with queueing', async () => {
    let i = 0;
    const queueTaskRunner = new QueueTaskRunner<number>();

    const task1 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>(resolve => {
        setTimeout(() => {
          resolve(++i);
        }, 500);
      });
    });
    const task2 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>(resolve => {
        resolve(++i);
      });
    });
    const task3 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>(resolve => {
        resolve(++i);
      });
    });

    queueTaskRunner.execOrQueue(task1);
    queueTaskRunner.execOrQueue(task2);
    queueTaskRunner.execOrQueue(task3);
    expect(await task1.getResult()).toBe(1);
    expect(await task2.getResult()).toBe(2);
    expect(await task3.getResult()).toBe(3);

    // do it again
    const task4 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>(resolve => {
        setTimeout(() => {
          resolve(++i);
        }, 500);
      });
    });
    const task5 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>(resolve => {
        resolve(++i);
      });
    });
    const task6 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>(resolve => {
        resolve(++i);
      });
    });

    queueTaskRunner.execOrQueue(task4);
    queueTaskRunner.execOrQueue(task5);
    queueTaskRunner.execOrQueue(task6);
    expect(await task4.getResult()).toBe(4);
    expect(await task5.getResult()).toBe(5);
    expect(await task6.getResult()).toBe(6);
  });

  test("it should catch the function's error and escalate that to the task's result", async () => {
    const queueTaskRunner = new QueueTaskRunner<number>();

    const task1 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('error: task1'));
        }, 500);
      });
    });
    const task2 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        reject(new Error('error: task2'));
      });
    });
    const task3 = await Task.make<number>(async (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        reject(new Error('error: task3'));
      });
    });

    queueTaskRunner.execOrQueue(task1);
    queueTaskRunner.execOrQueue(task2);
    queueTaskRunner.execOrQueue(task3);
    await expect(task1.getResult()).rejects.toThrowError('error: task1');
    await expect(task2.getResult()).rejects.toThrowError('error: task2');
    await expect(task3.getResult()).rejects.toThrowError('error: task3');
  });

  test("task's TTL has exceeded", async () => {
    const queueTaskRunner = new QueueTaskRunner<string>();
    const task = await Task.make<string>(async (): Promise<string> => {
      return 'foo';
    }, Date.now() - 1);
    // ~~~~~~~~~~~~~~ force expiration
    queueTaskRunner.execOrQueue(task);

    await expect(task.getResult()).rejects.toThrowError(
      new TaskTTLExceededError('the ttl of queued task has exceeded'),
    );
  });
});
