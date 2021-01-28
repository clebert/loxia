import {Host, Subject} from 'batis';
import {UseReceiver, createReceiverHook} from './create-receiver-hook';

const useReceiver = createReceiverHook(Host);
const receivingReceiver = () => ({state: 'receiving'});
const successfulReceiver = (value: string) => ({state: 'successful', value});
const failedReceiver = (reason: unknown) => ({state: 'failed', reason});

describe('useReceiver()', () => {
  let subject: Subject<UseReceiver>;

  beforeEach(() => {
    subject = new Subject(useReceiver);
  });

  test('successful receiving', async () => {
    subject.host.render(Promise.resolve('a'));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(successfulReceiver('a')),
      Host.createRenderingEvent(receivingReceiver()),
    ]);

    subject.host.render(Promise.resolve('b'));
    subject.host.render(Promise.resolve('c'));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(successfulReceiver('c')),
      Host.createRenderingEvent(receivingReceiver()),
      Host.createRenderingEvent(receivingReceiver()),
    ]);

    subject.host.render(Promise.resolve().then(() => 'd'));
    subject.host.render(Promise.resolve('e'));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(successfulReceiver('e')),
      Host.createRenderingEvent(receivingReceiver()),
      Host.createRenderingEvent(receivingReceiver()),
    ]);
  });

  test('failed receiving', async () => {
    subject.host.render(Promise.reject());

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(failedReceiver(undefined)),
      Host.createRenderingEvent(receivingReceiver()),
    ]);

    subject.host.render(Promise.reject(new Error('b')));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(failedReceiver(new Error('b'))),
      Host.createRenderingEvent(receivingReceiver()),
    ]);

    subject.host.render(
      Promise.resolve().then(() => {
        throw new Error('c');
      })
    );

    subject.host.render(Promise.reject(new Error('d')));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(failedReceiver(new Error('d'))),
      Host.createRenderingEvent(receivingReceiver()),
      Host.createRenderingEvent(receivingReceiver()),
    ]);
  });
});
