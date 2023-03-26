import {beforeEach, describe, expect, test} from '@jest/globals';
import {Host} from 'batis';
import type {UseReceiver} from './create-receiver-hook.js';
import {createReceiverHook} from './create-receiver-hook.js';

const useReceiver = createReceiverHook(Host.Hooks);
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

    expect(host.render(promiseA)).toEqual([receivingReceiver()]);

    await host.nextAsyncStateChange;

    expect(host.render(promiseA)).toEqual([successfulReceiver(`a`)]);

    const promiseB = Promise.resolve(`b`);
    const promiseC = Promise.resolve(`c`);

    expect(host.render(promiseB)).toEqual([receivingReceiver()]);
    expect(host.render(promiseC)).toEqual([receivingReceiver()]);

    await host.nextAsyncStateChange;

    expect(host.render(promiseC)).toEqual([successfulReceiver(`c`)]);
  });

  test(`failed receiving`, async () => {
    const promiseA = Promise.resolve().then(() => {
      throw new Error(`a`);
    });

    expect(host.render(promiseA)).toEqual([receivingReceiver()]);

    await host.nextAsyncStateChange;

    expect(host.render(promiseA)).toEqual([failedReceiver(new Error(`a`))]);

    const promiseB = Promise.resolve().then(() => {
      throw new Error(`b`);
    });

    const promiseC = Promise.resolve().then(() => {
      throw new Error(`c`);
    });

    expect(host.render(promiseB)).toEqual([receivingReceiver()]);
    expect(host.render(promiseC)).toEqual([receivingReceiver()]);

    await host.nextAsyncStateChange;

    expect(host.render(promiseC)).toEqual([failedReceiver(new Error(`c`))]);
  });
});
