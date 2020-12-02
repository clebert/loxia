import type {useEffect, useMemo, useRef, useState} from 'batis';

export type ReceiverState<TValue> =
  | ReceivingReceiverState
  | ReceivedReceiverState<TValue>
  | FailedReceiverState;

export interface ReceivingReceiverState {
  readonly status: 'receiving';
  readonly value?: undefined;
  readonly error?: undefined;
}

export interface ReceivedReceiverState<TValue> {
  readonly status: 'received';
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
          if (mountedRef.current) {
            setResult({ok: true, value, signal});
          }
        })
        .catch((error) => {
          if (mountedRef.current) {
            setResult({ok: false, error, signal});
          }
        });
    }, [signal]);

    return hooks.useMemo(() => {
      if (signal === result?.signal) {
        return result.ok
          ? {status: 'received', value: result.value}
          : {status: 'failed', error: result.error};
      }

      return {status: 'receiving'};
    }, [signal, result]);
  };
}
