import type {Host} from 'batis';

export type UseTransition = <TCallback extends (...args: any[]) => any>(
  callback: TCallback,
  dependencies: readonly unknown[]
) => Transition<TCallback>;

export type Transition<TCallback extends (...args: any[]) => void> = (
  ...args: Parameters<TCallback>
) => boolean;

/**
 * A transition is a function with special runtime behavior suitable for
 * enabling transitions of state machines. A transition works only once and only
 * if its dependencies have not changed, so it should depend on the state of its
 * associated state machine.
 */
export function createTransitionHook(
  hooks: Pick<typeof Host, 'useCallback' | 'useMemo' | 'useRef'>
): UseTransition {
  const {useCallback, useMemo, useRef} = hooks;

  return (callback, dependencies) => {
    const token = useMemo(() => ({}), dependencies);
    const tokenRef = useRef(token);

    tokenRef.current = token;

    let called = false;

    return useCallback(
      (...args) => {
        if (called || tokenRef.current !== token) {
          return false;
        }

        called = true;

        callback(...args);

        return true;
      },
      [token]
    );
  };
}
