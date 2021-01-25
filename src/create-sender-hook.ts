import type {Host} from 'batis';
import {createBinderHook} from './create-binder-hook';
import {createTransitionHook} from './create-transition-hook';

export type UseSender = () => SenderState;

export type SenderState =
  | IdleSenderState
  | SendingSenderState
  | FailedSenderState;

export interface IdleSenderState {
  readonly status: 'idle';
  readonly error?: undefined;
  readonly send: (signal: Promise<unknown>) => boolean;
}

export interface SendingSenderState {
  readonly status: 'sending';
  readonly error?: undefined;
  readonly send?: undefined;
}

export interface FailedSenderState {
  readonly status: 'failed';
  readonly error: Error;
  readonly send: (signal: Promise<unknown>) => boolean;
}

/**
 * A sender is a state machine which allows to send exactly one signal at a
 * time.
 *
 * Note: A sender automatically binds its asynchronous callback functions using
 * the `useBinder` Hook.
 */
export function createSenderHook(
  hooks: Omit<typeof Host, 'prototype'>
): UseSender {
  const {useMemo, useState} = hooks;
  const useBinder = createBinderHook(hooks);
  const useTransition = createTransitionHook(hooks);

  return () => {
    const bind = useBinder();

    const [state, setState] = useState<
      | {readonly status: 'idle'}
      | {readonly status: 'sending'}
      | {readonly status: 'failed'; readonly error: Error}
    >({status: 'idle'});

    const send = useTransition(
      (signal: Promise<any>) => {
        setState({status: 'sending'});

        signal.then(bind(() => setState({status: 'idle'}))).catch(
          bind((error: unknown) =>
            setState({
              status: 'failed',
              error:
                error instanceof Error
                  ? error
                  : new Error('Failed to send the signal.'),
            })
          )
        );
      },
      [state]
    );

    return useMemo(
      () => (state.status === 'sending' ? state : {...state, send}),
      [state]
    );
  };
}
