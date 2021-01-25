import {AnyHook, HostEvent, RenderingEvent} from 'batis';
import {defer} from './defer';

export class HostHistory<THook extends AnyHook> {
  readonly #events: HostEvent<THook>[] = [];

  #next = defer<void>();

  get next(): Promise<void> {
    return this.#next.promise;
  }

  get events(): readonly HostEvent<THook>[] {
    return [...this.#events];
  }

  get renderingEvent(): RenderingEvent<THook> | undefined {
    const event = this.#events[this.#events.length - 1];

    // istanbul ignore next
    return event?.type === 'rendering' ? event : undefined;
  }

  readonly push = (event: HostEvent<THook>): void => {
    this.#events.push(event);

    if (event?.type !== 'rendering' || !event.interim) {
      const next = this.#next;

      this.#next = defer();

      next.resolve();
    }
  };
}
