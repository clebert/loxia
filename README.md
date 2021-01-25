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

I consider React Hooks to be particularly suitable for implementing side-effect
dependent state machines. Based on this idea, I developed a
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

A transition is a function with special runtime behavior suitable for enabling
transitions of state machines. A transition works only once and only if its
dependencies have not changed, so it should depend on the state of its
associated state machine.

<details>
  <summary>Usage example</summary>

```js
import {createTransitionHook} from 'loxia';
import {Host} from 'batis'; // import * as React from 'react';
```

```js
const useTransition = createTransitionHook(Host /* React */);
```

```js
function useToggle() {
  const [state, setState] = Host /* React */.useState(false);

  const toggleState = useTransition(() => {
    setState((prevState) => !prevState);
  }, [state]);

  return [state, toggleState];
}
```

</details>

<details>
  <summary>Type definitions</summary>

```ts
function createTransitionHook(
  hooks: Pick<typeof Host, 'useCallback' | 'useMemo' | 'useRef'>
): UseTransition;
```

```ts
type UseTransition = <TCallback extends (...args: any[]) => any>(
  callback: TCallback,
  dependencies: readonly unknown[]
) => Transition<TCallback>;
```

```ts
type Transition<TCallback extends (...args: any[]) => void> = (
  ...args: Parameters<TCallback>
) => boolean;
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
```

```js
const useBinder = createBinderHook(Host /* React */);
```

```js
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
function createBinderHook(
  hooks: Pick<typeof Host, 'useCallback' | 'useEffect' | 'useRef'>
): UseBinder;
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

Note: A receiver automatically binds its asynchronous callback functions using
the `useBinder` Hook.

<details>
  <summary>Usage example</summary>

```js
import {createReceiverHook} from 'loxia';
import {Host} from 'batis'; // import * as React from 'react';
```

```js
const useReceiver = createReceiverHook(Host /* React */);
```

```js
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
function createReceiverHook(hooks: Omit<typeof Host, 'prototype'>): UseReceiver;
```

```ts
type UseReceiver = <TValue>(signal: Promise<TValue>) => ReceiverState<TValue>;
```

```ts
type ReceiverState<TValue> =
  | ReceivingReceiverState
  | SuccessfulReceiverState<TValue>
  | FailedReceiverState;

interface ReceivingReceiverState {
  readonly status: 'receiving';
  readonly value?: undefined;
  readonly error?: undefined;
}

interface SuccessfulReceiverState<TValue> {
  readonly status: 'successful';
  readonly value: TValue;
  readonly error?: undefined;
}

interface FailedReceiverState {
  readonly status: 'failed';
  readonly value?: undefined;
  readonly error: Error;
}
```

</details>

### `useSender`

A sender is a state machine which allows to send exactly one signal at a time.

Note: A sender automatically binds its asynchronous callback functions using the
`useBinder` Hook.

<details>
  <summary>Type definitions</summary>

```ts
function createSenderHook(hooks: Omit<typeof Host, 'prototype'>): UseSender;
```

```ts
type UseSender = () => SenderState;
```

```ts
type SenderState = IdleSenderState | SendingSenderState | FailedSenderState;

interface IdleSenderState {
  readonly status: 'idle';
  readonly error?: undefined;
  readonly send: (signal: Promise<unknown>) => boolean;
}

interface SendingSenderState {
  readonly status: 'sending';
  readonly error?: undefined;
  readonly send?: undefined;
}

interface FailedSenderState {
  readonly status: 'failed';
  readonly error: Error;
  readonly send: (signal: Promise<unknown>) => boolean;
}
```

</details>

## Development

<details>
  <summary>Publishing a new release</summary>

```
npm run release patch
```

```
npm run release minor
```

```
npm run release major
```

After a new release has been created by pushing the tag, it must be published
via the GitHub UI. This triggers the final publication to npm.

</details>

---

Copyright (c) 2020-2021, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/loxia/blob/master/LICENSE).
