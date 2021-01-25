import {Host} from 'batis';
import {UseBinder, createBinderHook} from './create-binder-hook';
import {HostHistory} from './host-history';

const useBinder = createBinderHook(Host);

describe('useBinder()', () => {
  test('a binding is tied to the lifecycle of the Hook that surrounds it', async () => {
    const history = new HostHistory<UseBinder>();
    const host = new Host(useBinder, history.push);

    host.render();

    const bind = history.renderingEvent!.result;
    const callback1 = jest.fn();
    const binding1 = bind(callback1);
    const callback2 = jest.fn();
    const binding2 = bind(callback2);

    expect(binding1('a', 'b')).toBe(true);
    expect(callback1).toHaveBeenCalledWith('a', 'b');
    expect(binding1('c', 'd')).toBe(true);
    expect(callback1).toHaveBeenCalledWith('c', 'd');
    expect(binding2(0, 1)).toBe(true);
    expect(callback2).toHaveBeenCalledWith(0, 1);
    expect(binding2(2, 3)).toBe(true);
    expect(callback2).toHaveBeenCalledWith(2, 3);

    host.render();

    expect(binding1('e', 'f')).toBe(true);
    expect(callback1).toHaveBeenCalledWith('e', 'f');
    expect(binding2(4, 5)).toBe(true);
    expect(callback2).toHaveBeenCalledWith(4, 5);

    host.reset();

    expect(binding1('g', 'h')).toBe(false);
    expect(callback1).toHaveBeenCalledTimes(3);
    expect(binding2(6, 7)).toBe(false);
    expect(callback2).toHaveBeenCalledTimes(3);

    expect(history.events).toEqual([
      {type: 'rendering', result: bind},
      {type: 'rendering', result: bind},
      {type: 'reset'},
    ]);
  });
});