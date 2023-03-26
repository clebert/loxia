import {describe, expect, jest, test} from '@jest/globals';
import {
  Host,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'batis';
import {createTransitionHook} from './create-transition-hook.js';

const useTransition = createTransitionHook({
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
});

describe(`useTransition()`, () => {
  test(`a transition returns true only once`, () => {
    const host = new Host(useTransition);
    const [transition1] = host.run(0);
    const callback = jest.fn();

    expect(transition1(callback)).toBe(true);
    expect(transition1(callback)).toBe(false);

    host.run(0);

    expect(transition1(callback)).toBe(false);

    const [transition2] = host.run(1);

    host.run(1);

    expect(transition2(callback)).toBe(true);
    expect(transition2(callback)).toBe(false);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test(`a transition returns false if its dependencies have changed`, () => {
    const host = new Host(useTransition);
    const [transition] = host.run(0);

    host.run(1);

    const callback = jest.fn();

    expect(transition(callback)).toBe(false);

    expect(callback).toHaveBeenCalledTimes(0);
  });

  test(`a transition is stable as long as its dependencies have not changed`, () => {
    const host = new Host(useTransition);
    const [transition] = host.run(0);

    expect(host.run(0)).toEqual([transition]);
    expect(host.run(1)).not.toEqual([transition]);
  });
});
