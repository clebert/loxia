import {Host} from 'batis';
import {UseTransition, createTransitionHook} from './create-transition-hook';
import {HostHistory} from './host-history';

const useTransition = createTransitionHook(Host);

describe('useTransition()', () => {
  let hostHistory: HostHistory<UseTransition>;

  beforeEach(() => {
    hostHistory = new HostHistory();
  });

  test('a transition works only once', () => {
    const host = new Host(useTransition, hostHistory.push);
    const callback = jest.fn();

    host.render(callback, [0]);

    const transition1 = hostHistory.renderingEvent!.result;

    expect(transition1()).toBe(true);
    expect(transition1()).toBe(false);

    host.render(callback, [0]);

    expect(transition1()).toBe(false);

    host.render(callback, [1]);

    const transition2 = hostHistory.renderingEvent!.result;

    host.render(callback, [1]);

    expect(transition2()).toBe(true);
    expect(transition2()).toBe(false);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('a transition does not work if its dependencies have changed', () => {
    const host = new Host(useTransition, hostHistory.push);
    const callback = jest.fn();

    host.render(callback, [0]);

    const transition = hostHistory.renderingEvent!.result!;

    host.render(callback, [1]);

    expect(transition()).toBe(false);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('a failed transition no longer works', () => {
    const host = new Host(useTransition, hostHistory.push);

    const callback = jest.fn(() => {
      throw new Error('oops');
    });

    host.render(callback, [0]);

    const transition = hostHistory.renderingEvent!.result;

    expect(transition).toThrow(new Error('oops'));
    expect(transition()).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('a transition is stable as long as its dependencies have not changed', () => {
    const host = new Host(useTransition, hostHistory.push);

    host.render(jest.fn(), [0]);

    const transition = hostHistory.renderingEvent!.result;

    host.render(jest.fn(), [0]);

    expect(hostHistory.renderingEvent!.result).toBe(transition);

    host.render(jest.fn(), [1]);

    expect(hostHistory.renderingEvent!.result).not.toBe(transition);
  });
});
