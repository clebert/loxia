import {
  HookProcess,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'batis';
import {createSenderHook} from './create-sender-hook';

const useSender = createSenderHook({
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
});

const idleState = {status: 'idle', send: expect.any(Function)};
const sendingState = {status: 'sending'};

const unknownFailureState = {
  status: 'failure',
  reason: 'Unknown error.',
  send: expect.any(Function),
};

const error1FailureState = {
  status: 'failure',
  reason: 'error1',
  send: expect.any(Function),
};

const error2FailureState = {
  status: 'failure',
  reason: 'error2',
  send: expect.any(Function),
};

describe('useSender()', () => {
  let sender: HookProcess<typeof useSender>;

  beforeEach(() => (sender = HookProcess.start(useSender, [])));
  afterEach(() => sender.stop());

  test('successful sending', async () => {
    sender.result.getCurrent().send!(Promise.resolve());

    expect(sender.result.getCurrent()).toEqual(idleState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(idleState);

    sender.result.getCurrent().send!(Promise.resolve());

    expect(sender.result.getCurrent()).toEqual(idleState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(idleState);
  });

  test('unsuccessful sending', async () => {
    sender.result.getCurrent().send!(Promise.reject());

    expect(sender.result.getCurrent()).toEqual(idleState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(unknownFailureState);

    sender.result.getCurrent().send!(Promise.reject(new Error()));

    expect(sender.result.getCurrent()).toEqual(unknownFailureState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(unknownFailureState);

    sender.result.getCurrent().send!(Promise.reject(new Error('error1')));

    expect(sender.result.getCurrent()).toEqual(unknownFailureState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(error1FailureState);

    sender.result.getCurrent().send!(Promise.reject('error2'));

    expect(sender.result.getCurrent()).toEqual(error1FailureState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(error2FailureState);
  });

  test('failure recovery', async () => {
    sender.result.getCurrent().send!(Promise.reject());

    expect(sender.result.getCurrent()).toEqual(idleState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(unknownFailureState);

    sender.result.getCurrent().send!(Promise.resolve());

    expect(sender.result.getCurrent()).toEqual(unknownFailureState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(idleState);
  });

  test('multiple sending', async () => {
    const {send} = sender.result.getCurrent();

    send!(Promise.resolve());
    send!(Promise.resolve());

    await expect(sender.result.getNextAsync()).rejects.toThrow(
      new Error('A signal is already being sent.')
    );
  });

  test('effect triggering', async () => {
    const effect1 = jest.fn();

    sender.result.getCurrent().send!(Promise.resolve('a'), effect1);

    expect(sender.result.getCurrent()).toEqual(idleState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(idleState);
    expect(effect1).toHaveBeenCalledWith('a');

    const effect2 = jest.fn();

    sender.result.getCurrent().send!(Promise.reject(), effect2);

    expect(sender.result.getCurrent()).toEqual(idleState);
    expect(await sender.result.getNextAsync()).toEqual(sendingState);
    expect(await sender.result.getNextAsync()).toEqual(unknownFailureState);
    expect(effect2).not.toHaveBeenCalled();
  });
});
