import type {useCallback, useEffect, useMemo, useRef, useState} from 'batis';

export type SenderState =
  | IdleSenderState
  | SendingSenderState
  | FailedSenderState;

export interface IdleSenderState {
  readonly status: 'idle';
  readonly error?: undefined;

  readonly send: <TValue>(
    signal: Promise<TValue>,
    effect?: Effect<TValue>
  ) => void;
}

export interface SendingSenderState {
  readonly status: 'sending';
  readonly error?: undefined;
  readonly send?: undefined;
}

export interface FailedSenderState {
  readonly status: 'failed';
  readonly error: Error;

  readonly send: <TValue>(
    signal: Promise<TValue>,
    effect?: Effect<TValue>
  ) => void;
}

export type Effect<TValue> = (value: TValue) => void;

export interface SenderHooks {
  readonly useCallback: typeof useCallback;
  readonly useEffect: typeof useEffect;
  readonly useMemo: typeof useMemo;
  readonly useRef: typeof useRef;
  readonly useState: typeof useState;
}

export function createSenderHook(hooks: SenderHooks): () => SenderState {
  return () => {
    const mountedRef = hooks.useRef(true);

    hooks.useEffect(() => () => void (mountedRef.current = false), []);

    const [sending, setSending] = hooks.useState(false);
    const [error, setError] = hooks.useState<Error | undefined>(undefined);

    const send = hooks.useCallback<IdleSenderState['send']>(
      (signal, effect) => {
        setSending((prevSending) => {
          if (prevSending) {
            throw new Error('A signal is already being sent.');
          }

          return true;
        });

        signal
          .then((value) => {
            /* istanbul ignore next */
            if (!mountedRef.current) {
              return;
            }

            setSending(false);
            setError(undefined);
            effect?.(value);
          })
          .catch((maybeError: unknown) => {
            /* istanbul ignore next */
            if (!mountedRef.current) {
              return;
            }

            setSending(false);

            if (maybeError instanceof Error) {
              setError(maybeError);
            } else if (typeof maybeError === 'string') {
              setError(new Error(maybeError));
            } else {
              setError(new Error());
            }
          });
      },
      []
    );

    return hooks.useMemo(
      () =>
        sending
          ? {status: 'sending'}
          : error
          ? {status: 'failed', error, send}
          : {status: 'idle', send},
      [sending, error]
    );
  };
}
