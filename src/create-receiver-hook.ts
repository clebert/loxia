import type {Host} from 'batis';
import {createBinderHook} from './create-binder-hook';

export type UseReceiver = <TValue>(
  signal: Promise<TValue>
) => ReceiverState<TValue>;

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

/**
 * A receiver is a state machine which allows the reception of a signal in the
 * form of a promise passed as an argument. A receiver is always in one of the
 * following states `receiving`, `successful`, or `failed`. As long as the
 * reference to the passed promise remains the same, a receiver represents the
 * state of the promise. When a reference to a new promise is passed, the old
 * promise no longer affects the receiver state.
 *
 * It makes sense to use a receiver if an asynchronous operation is based on
 * user input. If the user input changes in the meantime and a new asynchronous
 * operation overwrites the old one, the old one should no longer have any effect.
 *
 * Note: A receiver automatically binds its asynchronous callback functions
 * using the `useBinder` Hook.
 */
export function createReceiverHook(
  hooks: Omit<typeof Host, 'prototype'>
): UseReceiver {
  const {useEffect, useMemo, useState} = hooks;
  const useBinder = createBinderHook(hooks);

  return <TValue>(signal: Promise<TValue>) => {
    const bind = useBinder();

    const [state, setState] = useState<
      ReceiverState<TValue> & {readonly signal: Promise<TValue>}
    >({status: 'receiving', signal});

    useEffect(() => {
      setState((prevState) =>
        prevState.status === 'receiving' && prevState.signal === signal
          ? prevState
          : {status: 'receiving', signal}
      );

      signal
        .then(
          bind((value) =>
            setState((prevState) =>
              prevState.status !== 'receiving' || prevState.signal !== signal
                ? prevState
                : {status: 'successful', value, signal}
            )
          )
        )
        .catch(
          bind((error: unknown) =>
            setState((prevState) =>
              prevState.status !== 'receiving' || prevState.signal !== signal
                ? prevState
                : error instanceof Error
                ? {status: 'failed', error, signal}
                : {
                    status: 'failed',
                    error: new Error('Failed to receive the signal.'),
                    signal,
                  }
            )
          )
        );
    }, [signal]);

    return useMemo(() => {
      const {signal: stateSignal, ...stateRest} = state;

      return signal === stateSignal ? stateRest : {status: 'receiving'};
    }, [state, signal]);
  };
}
