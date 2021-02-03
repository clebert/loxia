# Loxia

[![][ci-badge]][ci-link] [![][version-badge]][version-link]
[![][license-badge]][license-link] [![][types-badge]][types-link]
[![][size-badge]][size-link]

[ci-badge]: https://github.com/clebert/loxia/workflows/CI/badge.svg
[ci-link]: https://github.com/clebert/loxia
[version-badge]: https://badgen.net/npm/v/loxia
[version-link]: https://www.npmjs.com/package/loxia
[license-badge]: https://badgen.net/npm/license/loxia
[license-link]: https://github.com/clebert/loxia/blob/master/LICENSE
[types-badge]: https://badgen.net/npm/types/loxia
[types-link]: https://github.com/clebert/loxia
[size-badge]: https://badgen.net/bundlephobia/minzip/loxia
[size-link]: https://bundlephobia.com/result?p=loxia

Implementing JavaScript state machines using React Hooks.

## Installation

```
npm install loxia --save
```

## Motivation

I consider React Hooks to be particularly suitable for implementing state
machines. Based on this idea, I developed a
[bookmark manager](https://github.com/clebert/bookmark.wtf). It's UI makes
intensive use of the Hooks and patterns developed here and serves as a real
world test.

## Hooks

In general, all Hooks in this library are built to be used with any React Hooks
compliant implementation. That would be, for example,
[Batis](https://github.com/clebert/batis), Preact, and of course React. In the
usage examples, Batis is always used, but as an alternative, the analogous usage
with React is shown as a comment.

### `useTransition`

A transition is a function with special runtime behavior that can be used to
implement the correct behavior of the transition methods of a state machine. A
transition executes the passed callback once and returns true if its
dependencies have not changed, so it should depend on the state of the
associated state machine.

<details>
  <summary>Usage example</summary>

```js
import {createTransitionHook} from 'loxia';
import {Host} from 'batis'; // import * as React from 'react';

const useTransition = createTransitionHook(Host /* React */);

function useLock(): Lock {
  const [locked, setLocked] = Host /* React */.useState(false);
  const transition = useTransition(locked);

  const lock = Host /* React */.useCallback(
    () => transition(() => setLocked(true)),
    [transition]
  );

  const unlock = Host /* React */.useCallback(
    () => transition(() => setLocked(false)),
    [transition]
  );

  return Host /* React */.useMemo(
    () => (locked ? {locked, unlock} : {locked, lock}),
    [locked]
  );
}
```

</details>

<details>
  <summary>Type definitions</summary>

```ts
function createTransitionHook(hooks: BatisHooks): UseTransition;
```

```ts
type UseTransition = (
  ...dependencies: readonly [unknown, ...unknown[]]
) => Transition;
```

```ts
type Transition = (callback?: () => void) => boolean;
```

</details>

### `useBinder`

A binding is a function that is tied to the life cycle of the Hook or component
it surrounds. Often React components are already unmounted and an associated
asynchronous operation should no longer have any effect. It is therefore useful
to bind the callback functions of `Promise.then`, `Promise.catch`, and also
`setTimeout`.

<details>
  <summary>Usage example</summary>

```js
import {createBinderHook} from 'loxia';
import {Host} from 'batis'; // import * as React from 'react';

const useBinder = createBinderHook(Host /* React */);

function useExample() {
  const bind = useBinder();

  Host /* React */.useEffect(() => {
    setTimeout(
      bind(() => {
        // ...
      })
    );
  });
}
```

</details>

<details>
  <summary>Type definitions</summary>

```ts
function createBinderHook(hooks: BatisHooks): UseBinder;
```

```ts
type UseBinder = () => Bind;
```

```ts
type Bind = <TCallback extends (...args: any[]) => void>(
  callback: TCallback
) => Binding<TCallback>;
```

```ts
type Binding<TCallback extends (...args: any[]) => void> = (
  ...args: Parameters<TCallback>
) => boolean;
```

</details>

### `useReceiver`

A receiver is a state machine which allows the reception of a signal in the form
of a promise passed as an argument. A receiver is always in one of the following
states `receiving`, `successful`, or `failed`. As long as the reference to the
passed promise remains the same, a receiver represents the state of the promise.
When a reference to a new promise is passed, the old promise no longer affects
the receiver state.

It makes sense to use a receiver if an asynchronous operation is based on user
input. If the user input changes in the meantime and a new asynchronous
operation overwrites the old one, the old one should no longer have any effect.

<details>
  <summary>Usage example</summary>

```js
import {createReceiverHook} from 'loxia';
import {Host} from 'batis'; // import * as React from 'react';

const useReceiver = createReceiverHook(Host /* React */);

function useAsyncJsonData(url) {
  const signal = Host /* React */.useMemo(
    () => fetch(url).then((response) => response.json()),
    [url]
  );

  return useReceiver(signal);
}
```

</details>

<details>
  <summary>Type definitions</summary>

```ts
function createReceiverHook(hooks: BatisHooks): UseReceiver;
```

```ts
type UseReceiver = <TValue>(signal: Promise<TValue>) => Receiver<TValue>;
```

```ts
type Receiver<TValue> =
  | ReceivingReceiver
  | SuccessfulReceiver<TValue>
  | FailedReceiver;

interface ReceivingReceiver {
  readonly state: 'receiving';
  readonly value?: undefined;
  readonly reason?: undefined;
}

interface SuccessfulReceiver<TValue> {
  readonly state: 'successful';
  readonly value: TValue;
  readonly reason?: undefined;
}

interface FailedReceiver {
  readonly state: 'failed';
  readonly value?: undefined;
  readonly reason: unknown;
}
```

</details>

### `useSender`

A sender is a state machine which allows to send exactly one signal at a time.

<details>
  <summary>Type definitions</summary>

```ts
function createSenderHook(hooks: BatisHooks): UseSender;
```

```ts
type UseSender = () => Sender;
```

```ts
type Sender = IdleSender | SendingSender | FailedSender;

interface IdleSender {
  readonly state: 'idle';
  readonly reason?: undefined;

  send(signal: Promise<unknown>): boolean;
}

interface SendingSender {
  readonly state: 'sending';
  readonly reason?: undefined;
  readonly send?: undefined;
}

interface FailedSender {
  readonly state: 'failed';
  readonly reason: unknown;

  send(signal: Promise<unknown>): boolean;
}
```

</details>

---

Copyright (c) 2020-2021, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/loxia/blob/master/LICENSE).
