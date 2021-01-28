import {Host, Subject} from 'batis';
import {createTransitionHook} from './create-transition-hook';

const useTransition = createTransitionHook(Host);

describe('useTransition()', () => {
  test('a transition returns true only once', () => {
    const subject = new Subject(useTransition);

    subject.host.render(0);

    const callback = jest.fn();
    const transition1 = subject.latestEvent?.result!;

    expect(transition1(callback)).toBe(true);
    expect(transition1(callback)).toBe(false);

    subject.host.render(0);

    expect(transition1(callback)).toBe(false);

    subject.host.render(1);

    const transition2 = subject.latestEvent?.result!;

    subject.host.render(1);

    expect(transition2(callback)).toBe(true);
    expect(transition2(callback)).toBe(false);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('a transition returns false if its dependencies have changed', () => {
    const subject = new Subject(useTransition);

    subject.host.render(0);

    const transition = subject.latestEvent?.result!;

    subject.host.render(1);

    const callback = jest.fn();

    expect(transition(callback)).toBe(false);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('a transition is stable as long as its dependencies have not changed', () => {
    const subject = new Subject(useTransition);

    subject.host.render(0);

    const transition = subject.latestEvent?.result!;

    subject.host.render(0);

    expect(subject.latestEvent?.result).toBe(transition);

    subject.host.render(1);

    expect(subject.latestEvent?.result).not.toBe(transition);
  });
});
