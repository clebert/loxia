import {Host, Subject} from 'batis';
import {createSenderHook} from './create-sender-hook';

const useSender = createSenderHook(Host);
const idleSender = () => ({state: 'idle', send: expect.any(Function)});
const sendingSender = () => ({state: 'sending'});

const failedSender = (reason: unknown) => ({
  state: 'failed',
  reason,
  send: expect.any(Function),
});

describe('useSender()', () => {
  test('successful sending', async () => {
    const subject = new Subject(useSender);

    subject.host.render();

    subject.latestEvent?.result!.send?.(Promise.resolve());

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(idleSender()),
      Host.createRenderingEvent(sendingSender()),
      Host.createRenderingEvent(idleSender()),
    ]);

    subject.latestEvent?.result!.send?.(Promise.resolve());

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(idleSender()),
      Host.createRenderingEvent(sendingSender()),
    ]);
  });

  test('failed sending', async () => {
    const subject = new Subject(useSender);

    subject.host.render();

    subject.latestEvent?.result!.send?.(Promise.reject(new Error('1')));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(failedSender(new Error('1'))),
      Host.createRenderingEvent(sendingSender()),
      Host.createRenderingEvent(idleSender()),
    ]);

    subject.latestEvent?.result!.send?.(Promise.reject(new Error('2')));

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(failedSender(new Error('2'))),
      Host.createRenderingEvent(sendingSender()),
    ]);
  });

  test('send transition', async () => {
    const subject = new Subject(useSender);

    subject.host.render();

    expect(subject.latestEvent?.result!.send?.(Promise.resolve())).toBe(true);

    expect(
      subject.latestEvent?.result!.send?.(Promise.reject(new Error()))
    ).toBe(false);

    expect(await subject.nextEventBatch).toEqual([
      Host.createRenderingEvent(idleSender()),
      Host.createRenderingEvent(sendingSender()),
      Host.createRenderingEvent(idleSender()),
    ]);
  });
});
