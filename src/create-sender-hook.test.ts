import {
  HookProcess,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'batis';
import {
  FailedSenderState,
  IdleSenderState,
  SendingSenderState,
  createSenderHook,
} from './create-sender-hook';

const useSender = createSenderHook({
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
});

const idleState: IdleSenderState = {status: 'idle', send: expect.any(Function)};
const sendingState: SendingSenderState = {status: 'sending'};

const failedStateUnknown: FailedSenderState = {
  status: 'failed',
  error: new Error(),
  send: expect.any(Function),
};

const failedStateOops: FailedSenderState = {
  status: 'failed',
  error: new Error('oops'),
  send: expect.any(Function),
};

describe('useSender()', () => {
  let sender: HookProcess<typeof useSender>;

  beforeEach(() => (sender = HookProcess.start(useSender, [])));
  afterEach(() => sender.stop());

  test('successful sending', async () => {
    sender.result.value.send!(Promise.resolve());

    expect(sender.result.value).toEqual(idleState);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(idleState);

    sender.result.value.send!(Promise.resolve());

    expect(sender.result.value).toEqual(idleState);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(idleState);
  });

  test('unsuccessful sending', async () => {
    sender.result.value.send!(Promise.reject());

    expect(sender.result.value).toEqual(idleState);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateUnknown);

    sender.result.value.send!(Promise.reject(new Error('oops')));

    expect(sender.result.value).toEqual(failedStateUnknown);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateOops);

    sender.result.value.send!(Promise.reject(new Error()));

    expect(sender.result.value).toEqual(failedStateOops);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateUnknown);

    sender.result.value.send!(Promise.reject('oops'));

    expect(sender.result.value).toEqual(failedStateUnknown);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateOops);

    sender.result.value.send!(Promise.reject(''));

    expect(sender.result.value).toEqual(failedStateOops);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateUnknown);
  });

  test('error recovery', async () => {
    sender.result.value.send!(Promise.reject());

    expect(sender.result.value).toEqual(idleState);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateUnknown);

    sender.result.value.send!(Promise.resolve());

    expect(sender.result.value).toEqual(failedStateUnknown);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(idleState);
  });

  test('multiple sending', async () => {
    const {send} = sender.result.value;

    send!(Promise.resolve());
    send!(Promise.resolve());

    await expect(sender.result.next).rejects.toThrow(
      new Error('A signal is already being sent.')
    );
  });

  test('effect triggering', async () => {
    const effect1 = jest.fn();

    sender.result.value.send!(Promise.resolve('a'), effect1);

    expect(sender.result.value).toEqual(idleState);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(idleState);
    expect(effect1).toHaveBeenCalledWith('a');

    const effect2 = jest.fn();

    sender.result.value.send!(Promise.reject(), effect2);

    expect(sender.result.value).toEqual(idleState);
    expect((await sender.result.next).value).toEqual(sendingState);
    expect((await sender.result.next).value).toEqual(failedStateUnknown);
    expect(effect2).not.toHaveBeenCalled();
  });
});
