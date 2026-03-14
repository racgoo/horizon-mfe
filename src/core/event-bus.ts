import type { EventHandler, IEventBus } from "./types";

/**
 * A tiny typed event bus used for cross-app communication.
 *
 * Usage (host):
 *   import { eventBus } from 'horizon-mfe'
 *   eventBus.emit('user:login', { id: 1 })
 *
 * Usage (child app):
 *   props.eventBus.on('user:login', ({ id }) => ...)
 */
export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private store = new Map<string, unknown>();

  emit<T = unknown>(event: string, payload?: T): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  setState<T = unknown>(key: string, value: T): void {
    this.store.set(key, value);
    this.emit(`store:${key}`, value);
  }

  getState<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  clear(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}

export const eventBus = new EventBus();

