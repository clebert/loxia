import type Batis from 'batis';

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
export type SenderHook = () => SenderState;

export interface SenderInit {
  readonly useCallback: typeof Batis.useCallback;
  readonly useEffect: typeof Batis.useEffect;
  readonly useMemo: typeof Batis.useMemo;
  readonly useRef: typeof Batis.useRef;
  readonly useState: typeof Batis.useState;
}

export function createSenderHook(init: SenderInit): SenderHook {
  const {useCallback, useEffect, useMemo, useRef, useState} = init;

  return () => {
    const mountedRef = useRef(true);

    useEffect(() => () => void (mountedRef.current = false), []);

    const [sending, setSending] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);

    const send = useCallback<IdleSenderState['send']>((signal, effect) => {
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
    }, []);

    return useMemo(
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
