import {createBinderHook} from './create-binder-hook.js';
import {createTransitionHook} from './create-transition-hook.js';
import {type Hooks} from './hooks.js';

export type UseSender = () => Sender;
export type Sender = IdleSender | SendingSender | FailedSender;

export interface IdleSender {
  readonly state: 'idle';

  send(signal: Promise<unknown>): boolean;
}

export interface SendingSender {
  readonly state: 'sending';
}

export interface FailedSender {
  readonly state: 'failed';
  readonly error: unknown;

  send(signal: Promise<unknown>): boolean;
}

/**
 * A sender is a state machine which allows to send exactly one signal at a
 * time.
 */
export function createSenderHook(hooks: Hooks): UseSender {
  const {useCallback, useMemo, useState} = hooks;
  const useBinder = createBinderHook(hooks);
  const useTransition = createTransitionHook(hooks);

  return () => {
    const bind = useBinder();

    const [sender, setSender] = useState<
      {state: 'idle'} | {state: 'sending'} | {state: 'failed'; error: unknown}
    >({state: `idle`});

    const transition = useTransition(sender);

    const send = useCallback(
      (signal: Promise<any>) => {
        const status = transition(() => {
          setSender({state: `sending`});

          signal
            .then(bind(() => setSender({state: `idle`})))
            .catch(bind((error) => setSender({state: `failed`, error})));
        });

        if (!status) {
          signal.catch(() => undefined);
        }

        return status;
      },
      [transition],
    );

    return useMemo(
      () => (sender.state === `sending` ? sender : {...sender, send}),
      [transition],
    );
  };
}
