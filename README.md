# miniq [![.github/workflows/check.yml](https://github.com/moznion/miniq/actions/workflows/check.yml/badge.svg)](https://github.com/moznion/miniq/actions/workflows/check.yml) [![codecov](https://codecov.io/gh/moznion/miniq/branch/main/graph/badge.svg?token=IXK4KN1VR9)](https://codecov.io/gh/moznion/miniq) [![npm version](https://badge.fury.io/js/@moznion%2Fminiq.svg)](https://badge.fury.io/js/@moznion%2Fminiq)

A minimal in-process queue system for TypeScript/JavaScript that supports TTL mechanism.

## Synopsis

```ts
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

queueTaskRunner.enqueue(task1); // runner runs task1, and the task takes 500ms
queueTaskRunner.enqueue(task2); // runner queues task2 and defer it after task1
queueTaskRunner.enqueue(task3); // runner queues task3 and defer it after task2

console.log(await task1.getResult()); // => 1
console.log(await task2.getResult()); // => 2
console.log(await task3.getResult()); // => 3
```

## Description

`QueueTaskRunner#enqueue(task: Task<T>)` receives a task and appends that task to the queue and runs the tasks in a queue
from the beginning of the queue.

`Task<T>` represents the task that you wanted to do according to the FIFO, and the task runner executes the enqueued
task's `async do(): Promise<void>`.
The point is this `do()` returns the `Promise<void>` so the client code cannot get the result of the actual procedure,
but you can use `async Task#getResult(): Promise<T>` to take that.
So the basic usage should be enqueuing a task and waiting for the result by `await getResult()` for the task.

Please see also [typedoc](https://moznion.github.io/miniq/).

### TTL

You can give a task the TTL like:

```ts
const task = await Task.make<string>(async (): Promise<string> => {
  return 'foo';
}, Date.now() + 60000);
// ~~~~~~~~~~~~~~~~~~ TTL that represents 60 secs from now

...

await task.getResult(); // if the TTL has exceeded, it rejects this task and throws `TaskTTLExceededError`.
```

And a task that has the TTL has been enqueued and when the task runner takes the task to run, if the TTL exceeds
the current timestamp at that moment, it doesn't run that task and it rejects the task with `TaskTTLExceededError`.

## LISENCE

MIT

