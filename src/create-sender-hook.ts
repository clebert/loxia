import type {Host} from 'batis';
import {createBinderHook} from './create-binder-hook';
import {createTransitionHook} from './create-transition-hook';

export type UseSender = () => Sender;
export type Sender = IdleSender | SendingSender | FailedSender;

export interface IdleSender {
  readonly state: 'idle';
  readonly reason?: undefined;

  send(signal: Promise<unknown>): boolean;
}

export interface SendingSender {
  readonly state: 'sending';
  readonly reason?: undefined;
  readonly send?: undefined;
}

export interface FailedSender {
  readonly state: 'failed';
  readonly reason: unknown;

  send(signal: Promise<unknown>): boolean;
}

/**
 * A sender is a state machine which allows to send exactly one signal at a
 * time.
 */
export function createSenderHook(
  hooks: Omit<typeof Host, 'prototype'>
): UseSender {
  const {useCallback, useMemo, useState} = hooks;
  const useBinder = createBinderHook(hooks);
  const useTransition = createTransitionHook(hooks);

  return () => {
    const bind = useBinder();

    const [sender, setSender] = useState<
      {state: 'idle'} | {state: 'sending'} | {state: 'failed'; reason: unknown}
    >({state: 'idle'});

    const transition = useTransition(sender);

    const send = useCallback(
      (signal: Promise<any>) => {
        const status = transition(() => {
          setSender({state: 'sending'});

          signal
            .then(bind(() => setSender({state: 'idle'})))
            .catch(bind((reason) => setSender({state: 'failed', reason})));
        });

        if (!status) {
          signal.catch(() => undefined);
        }

        return status;
      },
      [transition]
    );

    return useMemo(
      () => (sender.state === 'sending' ? sender : {...sender, send}),
      [transition]
    );
  };
}
