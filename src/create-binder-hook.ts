import type {BatisHooks} from 'batis';

export type UseBinder = () => Bind;

export type Bind = <TCallback extends (...args: any[]) => void>(
  callback: TCallback,
) => Binding<TCallback>;

export type Binding<TCallback extends (...args: any[]) => void> = (
  ...args: Parameters<TCallback>
) => boolean;

/**
 * A binding is a function that is tied to the life cycle of the Hook or
 * component it surrounds. Often React components are already unmounted and an
 * associated asynchronous operation should no longer have any effect. It is
 * therefore useful to bind the callback functions of `Promise.then`,
 * `Promise.catch`, and also `setTimeout`.
 */
export function createBinderHook(hooks: BatisHooks): UseBinder {
  const {useCallback, useEffect, useRef} = hooks;

  return () => {
    const aliveRef = useRef(true);

    useEffect(() => () => void (aliveRef.current = false), []);

    return useCallback(
      (callback) =>
        (...args) => {
          if (!aliveRef.current) {
            return false;
          }

          callback(...args);

          return true;
        },
      [],
    );
  };
}
