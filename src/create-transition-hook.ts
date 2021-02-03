import type {BatisHooks} from 'batis';

export type UseTransition = (
  ...dependencies: readonly [unknown, ...unknown[]]
) => Transition;

export type Transition = (callback?: () => void) => boolean;

/**
 * A transition is a function with special runtime behavior that can be used to
 * implement the correct behavior of the transition methods of a state machine.
 * A transition executes the passed callback once and returns true if its
 * dependencies have not changed, so it should depend on the state of the
 * associated state machine.
 */
export function createTransitionHook(hooks: BatisHooks): UseTransition {
  const {useCallback, useMemo, useRef} = hooks;

  return (...dependencies) => {
    const token = useMemo(() => ({}), dependencies);
    const tokenRef = useRef(token);

    tokenRef.current = token;

    let called = false;

    return useCallback(
      (callback) => {
        if (!called && tokenRef.current === token) {
          called = true;

          callback?.();

          return true;
        }

        return false;
      },
      [token]
    );
  };
}
