import {Host} from 'batis';
import {
  FailedReceiverState,
  ReceivingReceiverState,
  SuccessfulReceiverState,
  UseReceiver,
  createReceiverHook,
} from './create-receiver-hook';
import {defer} from './defer';
import {HostHistory} from './host-history';

const useReceiver = createReceiverHook(Host);
const receivingState = (): ReceivingReceiverState => ({status: 'receiving'});

const successfulState = (value: string): SuccessfulReceiverState<string> => ({
  status: 'successful',
  value,
});

const failedState = (error: Error): FailedReceiverState => ({
  status: 'failed',
  error,
});

describe('useReceiver()', () => {
  let history: HostHistory<UseReceiver>;
  let host: Host<UseReceiver>;

  beforeEach(() => {
    history = new HostHistory();
    host = new Host(useReceiver, history.push);
  });

  test('successful receiving', async () => {
    host.render(Promise.resolve('a'));

    await history.next;

    host.render(Promise.resolve('b'));
    host.render(Promise.resolve('c'));

    await history.next;

    const signalD = defer<string>();
    const signalE = defer<string>();

    host.render(signalD.promise);
    host.render(signalE.promise);

    signalE.resolve('e');

    await history.next;

    signalD.resolve('d');

    await Promise.resolve();

    expect(history.events).toEqual([
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: successfulState('a'), async: true},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: successfulState('c'), async: true},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: successfulState('e'), async: true},
    ]);
  });

  test('failed receiving', async () => {
    host.render(Promise.reject());

    await history.next;

    host.render(Promise.reject(new Error('b')));

    await history.next;

    const signalC = defer();
    const signalD = defer();

    host.render(signalC.promise);
    host.render(signalD.promise);

    signalD.reject(new Error('d'));

    await history.next;

    signalC.reject(new Error('c'));

    await Promise.resolve();

    const defaultError = new Error('Failed to receive the signal.');

    expect(history.events).toEqual([
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: failedState(defaultError), async: true},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: failedState(new Error('b')), async: true},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: receivingState(), interim: true},
      {type: 'rendering', result: receivingState()},
      {type: 'rendering', result: failedState(new Error('d')), async: true},
    ]);
  });
});
