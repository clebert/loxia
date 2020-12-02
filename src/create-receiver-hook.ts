import type {useEffect, useMemo, useRef, useState} from 'batis';

export type ReceiverState<TValue> =
  | ReceivingReceiverState
  | SuccessReceiverState<TValue>
  | FailureReceiverState;

export interface ReceivingReceiverState {
  readonly status: 'receiving';
  readonly value?: undefined;
  readonly reason?: undefined;
}

export interface SuccessReceiverState<TValue> {
  readonly status: 'success';
  readonly value: TValue;
  readonly reason?: undefined;
}

export interface FailureReceiverState {
  readonly status: 'failure';
  readonly value?: undefined;
  readonly reason: Error;
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
      | {ok: false; reason: Error; signal: Promise<TValue>}
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
            setResult({ok: false, reason: error, signal});
          } else if (typeof error === 'string') {
            setResult({ok: false, reason: new Error(error), signal});
          } else {
            setResult({ok: false, reason: new Error(), signal});
          }
        });
    }, [signal]);

    return hooks.useMemo(() => {
      if (signal === result?.signal) {
        return result.ok
          ? {status: 'success', value: result.value}
          : {status: 'failure', reason: result.reason};
      }

      return {status: 'receiving'};
    }, [signal, result]);
  };
}
