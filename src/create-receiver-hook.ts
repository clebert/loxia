import type {useEffect, useMemo, useRef, useState} from 'batis';

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

export interface ReceiverHooks {
  readonly useEffect: typeof useEffect;
  readonly useMemo: typeof useMemo;
  readonly useRef: typeof useRef;
  readonly useState: typeof useState;
}

export function createReceiverHook(
  hooks: ReceiverHooks
): <TValue>(signal: Promise<TValue>) => ReceiverState<TValue> {
  return <TValue>(signal: Promise<TValue>) => {
    const mountedRef = hooks.useRef(true);

    hooks.useEffect(() => () => void (mountedRef.current = false), []);

    const [result, setResult] = hooks.useState<
      | {ok: true; value: TValue; signal: Promise<TValue>}
      | {ok: false; error: Error; signal: Promise<TValue>}
      | undefined
    >(undefined);

    hooks.useEffect(() => {
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

    return hooks.useMemo(() => {
      if (signal === result?.signal) {
        return result.ok
          ? {status: 'successful', value: result.value}
          : {status: 'failed', error: result.error};
      }

      return {status: 'receiving'};
    }, [signal, result]);
  };
}
