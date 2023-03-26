import {createBinderHook} from './create-binder-hook.js';
import type {Hooks} from './hooks.js';

export type UseReceiver = <TValue>(signal: Promise<TValue>) => Receiver<TValue>;

export type Receiver<TValue> =
  | ReceivingReceiver
  | SuccessfulReceiver<TValue>
  | FailedReceiver;

export interface ReceivingReceiver {
  readonly state: 'receiving';
}

export interface SuccessfulReceiver<TValue> {
  readonly state: 'successful';
  readonly value: TValue;
}

export interface FailedReceiver {
  readonly state: 'failed';
  readonly error: unknown;
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
 * operation overwrites the old one, the old one should no longer have any
 * effect.
 */
export function createReceiverHook(hooks: Hooks): UseReceiver {
  const {useEffect, useRef, useState} = hooks;
  const useBinder = createBinderHook(hooks);

  return <TValue>(signal: Promise<TValue>) => {
    const bind = useBinder();
    const receiverRef = useRef<Receiver<TValue>>({state: `receiving`});
    const signalRef = useRef(signal);

    if (
      signalRef.current !== signal &&
      receiverRef.current.state !== `receiving`
    ) {
      receiverRef.current = {state: `receiving`};
    }

    signalRef.current = signal;

    const [, rerender] = useState({});

    useEffect(() => {
      signal
        .then(
          bind((value) => {
            if (
              signalRef.current === signal &&
              receiverRef.current.state === `receiving`
            ) {
              receiverRef.current = {state: `successful`, value};

              rerender({});
            }
          }),
        )
        .catch(
          bind((error: unknown) => {
            if (
              signalRef.current === signal &&
              receiverRef.current.state === `receiving`
            ) {
              receiverRef.current = {state: `failed`, error};

              rerender({});
            }
          }),
        );
    }, [signal]);

    return receiverRef.current;
  };
}
