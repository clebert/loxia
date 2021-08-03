import {Host} from 'batis';
import {FailedSender, IdleSender, createSenderHook} from './create-sender-hook';

const useSender = createSenderHook(Host.Hooks);
const idleSender = () => ({state: 'idle', send: expect.any(Function)});
const sendingSender = () => ({state: 'sending'});

const failedSender = (error: unknown) => ({
  state: 'failed',
  error,
  send: expect.any(Function),
});

describe('useSender()', () => {
  test('successful sending', async () => {
    const host = new Host(useSender);
    const result1 = host.render();

    expect(result1).toEqual([idleSender()]);

    (result1[0] as IdleSender).send(Promise.resolve());

    expect(host.render()).toEqual([sendingSender()]);

    await host.nextAsyncStateChange;

    const result2 = host.render();

    expect(result2).toEqual([idleSender()]);

    (result2[0] as IdleSender).send(Promise.resolve());

    expect(host.render()).toEqual([sendingSender()]);

    await host.nextAsyncStateChange;

    expect(host.render()).toEqual([idleSender()]);
  });

  test('failed sending', async () => {
    const host = new Host(useSender);
    const result1 = host.render();

    expect(result1).toEqual([idleSender()]);

    (result1[0] as FailedSender).send(
      Promise.resolve().then(() => {
        throw new Error('a');
      })
    );

    expect(host.render()).toEqual([sendingSender()]);

    await host.nextAsyncStateChange;

    const result2 = host.render();

    expect(result2).toEqual([failedSender(new Error('a'))]);

    (result2[0] as FailedSender).send(
      Promise.resolve().then(() => {
        throw new Error('b');
      })
    );

    expect(host.render()).toEqual([sendingSender()]);

    await host.nextAsyncStateChange;

    expect(host.render()).toEqual([failedSender(new Error('b'))]);
  });

  test('send transition', async () => {
    const host = new Host(useSender);
    const [sender] = host.render();

    expect((sender as IdleSender).send(Promise.resolve('a'))).toBe(true);

    expect(
      (sender as IdleSender).send(
        Promise.resolve().then(() => {
          throw new Error('b');
        })
      )
    ).toBe(false);

    expect(host.render()).toEqual([sendingSender()]);

    await host.nextAsyncStateChange;

    expect(host.render()).toEqual([idleSender()]);
  });
});
