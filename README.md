# miniq

A minimal in-process queue system for TypeScript/JavaScript.

This supports TTL for a task.

TBD TBD TBD

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

queueTaskRunner.execOrQueue(task1); // runner runs task1, and the task takes 500ms
queueTaskRunner.execOrQueue(task2); // runner queues task2 and defer it after task1
queueTaskRunner.execOrQueue(task3); // runner queues task3 and defer it after task2

console.log(await task1.getResult()); // => 1
console.log(await task2.getResult()); // => 2
console.log(await task3.getResult()); // => 3
```

## LISENCE

MIT

