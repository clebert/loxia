import type {UseReceiver} from './create-receiver-hook.js';

import {createReceiverHook} from './create-receiver-hook.js';
import {beforeEach, describe, expect, test} from '@jest/globals';
import {
  Host,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'batis';

const useReceiver = createReceiverHook({
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
});

const receivingReceiver = () => ({state: `receiving`});
const successfulReceiver = (value: string) => ({state: `successful`, value});
const failedReceiver = (error: unknown) => ({state: `failed`, error});

describe(`useReceiver()`, () => {
  let host: Host<UseReceiver>;

  beforeEach(() => {
    host = new Host(useReceiver);
  });

  test(`successful receiving`, async () => {
    const promiseA = Promise.resolve(`a`);

    expect(host.run(promiseA)).toEqual([receivingReceiver()]);

    host.triggerAsyncEffects();

    await host.nextAsyncStateChange;

    expect(host.run(promiseA)).toEqual([successfulReceiver(`a`)]);

    const promiseB = Promise.resolve(`b`);
    const promiseC = Promise.resolve(`c`);

    expect(host.run(promiseB)).toEqual([receivingReceiver()]);
    expect(host.run(promiseC)).toEqual([receivingReceiver()]);

    host.triggerAsyncEffects();

    await host.nextAsyncStateChange;

    expect(host.run(promiseC)).toEqual([successfulReceiver(`c`)]);
  });

  test(`failed receiving`, async () => {
    const promiseA = Promise.resolve().then(() => {
      throw new Error(`a`);
    });

    expect(host.run(promiseA)).toEqual([receivingReceiver()]);

    host.triggerAsyncEffects();

    await host.nextAsyncStateChange;

    expect(host.run(promiseA)).toEqual([failedReceiver(new Error(`a`))]);

    const promiseB = Promise.resolve().then(() => {
      throw new Error(`b`);
    });

    const promiseC = Promise.resolve().then(() => {
      throw new Error(`c`);
    });

    expect(host.run(promiseB)).toEqual([receivingReceiver()]);
    expect(host.run(promiseC)).toEqual([receivingReceiver()]);

    host.triggerAsyncEffects();

    await host.nextAsyncStateChange;

    expect(host.run(promiseC)).toEqual([failedReceiver(new Error(`c`))]);
  });
});
