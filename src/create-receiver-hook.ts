import type Batis from 'batis';

export type ReceiverState<TValue> =
  | ReceivingReceiverState
  | SuccessfulReceiverState<TValue>
  | FailedReceiverState;

export interface ReceivingReceiverState {
  readonly status: 'receiving';
  readonly value?: undefined;
  readonly error?: undefined;
}

export interface SuccessfulReceiverState<TValue> {
  readonly status: 'successful';
  readonly value: TValue;
  readonly error?: undefined;
}

export interface FailedReceiverState {
  readonly status: 'failed';
  readonly value?: undefined;
  readonly error: Error;
}

export interface ReceiverInit {
  readonly useEffect: typeof Batis.useEffect;
  readonly useMemo: typeof Batis.useMemo;
  readonly useRef: typeof Batis.useRef;
  readonly useState: typeof Batis.useState;
}

export function createReceiverHook(
  init: ReceiverInit
): <TValue>(signal: Promise<TValue>) => ReceiverState<TValue> {
  const {useEffect, useMemo, useRef, useState} = init;

  return <TValue>(signal: Promise<TValue>) => {
    const mountedRef = useRef(true);

    useEffect(() => () => void (mountedRef.current = false), []);

    const [result, setResult] = useState<
      | {ok: true; value: TValue; signal: Promise<TValue>}
      | {ok: false; error: Error; signal: Promise<TValue>}
      | undefined
    >(undefined);

    useEffect(() => {
      signal
        ?.then((value) => {
          /* istanbul ignore next */
          if (!mountedRef.current) {
            return;
          }

          setResult({ok: true, value, signal});
        })
        .catch((error: unknown) => {
          /* istanbul ignore next */
          if (!mountedRef.current) {
            return;
          }

          if (error instanceof Error) {
            setResult({ok: false, error, signal});
          } else if (typeof error === 'string') {
            setResult({ok: false, error: new Error(error), signal});
          } else {
            setResult({ok: false, error: new Error(), signal});
          }
        });
    }, [signal]);

    return useMemo(() => {
      if (signal === result?.signal) {
        return result.ok
          ? {status: 'successful', value: result.value}
          : {status: 'failed', error: result.error};
      }

      return {status: 'receiving'};
    }, [signal, result]);
  };
}
