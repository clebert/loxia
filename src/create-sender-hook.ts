import type {useCallback, useEffect, useMemo, useRef, useState} from 'batis';

export type SenderState =
  | IdleSenderState
  | SendingSenderState
  | FailureSenderState;

export interface IdleSenderState {
  readonly status: 'idle';
  readonly reason?: undefined;

  readonly send: <TValue>(
    signal: Promise<TValue>,
    effect?: Effect<TValue>
  ) => void;
}

export interface SendingSenderState {
  readonly status: 'sending';
  readonly reason?: undefined;
  readonly send?: undefined;
}

export interface FailureSenderState {
  readonly status: 'failure';
  readonly reason: Error;

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
    const [reason, setReason] = hooks.useState<Error | undefined>(undefined);

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
            setReason(undefined);
            effect?.(value);
          })
          .catch((error: unknown) => {
            /* istanbul ignore next */
            if (!mountedRef.current) {
              return;
            }

            setSending(false);

            if (error instanceof Error) {
              setReason(error);
            } else if (typeof error === 'string') {
              setReason(new Error(error));
            } else {
              setReason(new Error());
            }
          });
      },
      []
    );

    return hooks.useMemo(
      () =>
        sending
          ? {status: 'sending'}
          : reason
          ? {status: 'failure', reason, send}
          : {status: 'idle', send},
      [sending, reason]
    );
  };
}
