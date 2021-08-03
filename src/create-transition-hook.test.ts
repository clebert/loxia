import {Host} from 'batis';
import {createTransitionHook} from './create-transition-hook';

const useTransition = createTransitionHook(Host.Hooks);

describe('useTransition()', () => {
  test('a transition returns true only once', () => {
    const host = new Host(useTransition);
    const [transition1] = host.render(0);
    const callback = jest.fn();

    expect(transition1(callback)).toBe(true);
    expect(transition1(callback)).toBe(false);

    host.render(0);

    expect(transition1(callback)).toBe(false);

    const [transition2] = host.render(1);

    host.render(1);

    expect(transition2(callback)).toBe(true);
    expect(transition2(callback)).toBe(false);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('a transition returns false if its dependencies have changed', () => {
    const host = new Host(useTransition);
    const [transition] = host.render(0);

    host.render(1);

    const callback = jest.fn();

    expect(transition(callback)).toBe(false);

    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('a transition is stable as long as its dependencies have not changed', () => {
    const host = new Host(useTransition);
    const [transition] = host.render(0);

    expect(host.render(0)).toEqual([transition]);
    expect(host.render(1)).not.toEqual([transition]);
  });
});
