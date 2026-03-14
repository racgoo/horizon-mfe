export type EventHandler<T = unknown> = (payload: T) => void;

export interface IEventBus {
  emit<T = unknown>(event: string, payload?: T): void;
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  setState<T = unknown>(key: string, value: T): void;
  getState<T = unknown>(key: string): T | undefined;
}
