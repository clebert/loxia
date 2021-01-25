import {Host} from 'batis';
import {
  FailedSenderState,
  IdleSenderState,
  SendingSenderState,
  UseSender,
  createSenderHook,
} from './create-sender-hook';
import {defer} from './defer';
import {HostHistory} from './host-history';

const useSender = createSenderHook(Host);

const idleState = (): IdleSenderState => ({
  status: 'idle',
  send: expect.any(Function),
});

const sendingState = (): SendingSenderState => ({status: 'sending'});

const failedState = (error: Error): FailedSenderState => ({
  status: 'failed',
  error,
  send: expect.any(Function),
});

describe('useSender()', () => {
  let history: HostHistory<UseSender>;
  let host: Host<UseSender>;

  beforeEach(() => {
    history = new HostHistory();
    host = new Host(useSender, history.push);
  });

  test('successful sending', async () => {
    host.render();

    history.renderingEvent?.result.send?.(Promise.resolve());

    await history.next;
    await history.next;

    history.renderingEvent?.result.send?.(Promise.resolve());

    await history.next;
    await history.next;
    await Promise.resolve();

    expect(history.events).toEqual([
      {type: 'rendering', result: idleState()},
      {type: 'rendering', result: sendingState(), async: true},
      {type: 'rendering', result: idleState(), async: true},
      {type: 'rendering', result: sendingState(), async: true},
      {type: 'rendering', result: idleState(), async: true},
    ]);
  });

  test('failed sending', async () => {
    host.render();

    history.renderingEvent?.result.send?.(Promise.reject());

    await history.next;
    await history.next;

    history.renderingEvent?.result.send?.(Promise.reject(new Error('oops')));

    await history.next;
    await history.next;

    const defaultError = new Error('Failed to send the signal.');

    expect(history.events).toEqual([
      {type: 'rendering', result: idleState()},
      {type: 'rendering', result: sendingState(), async: true},
      {type: 'rendering', result: failedState(defaultError), async: true},
      {type: 'rendering', result: sendingState(), async: true},
      {type: 'rendering', result: failedState(new Error('oops')), async: true},
    ]);
  });

  test('send transition', async () => {
    const signalA = defer<undefined>();
    const signalB = defer<undefined>();

    host.render();

    expect(history.renderingEvent?.result.send?.(signalA.promise)).toBe(true);
    expect(history.renderingEvent?.result.send?.(signalB.promise)).toBe(false);

    await history.next;

    signalB.resolve(undefined);

    await Promise.resolve();

    signalA.resolve(undefined);

    await history.next;

    expect(history.events).toEqual([
      {type: 'rendering', result: idleState()},
      {type: 'rendering', result: sendingState(), async: true},
      {type: 'rendering', result: idleState(), async: true},
    ]);
  });
});
