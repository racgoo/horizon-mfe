import type { IEventBus } from "./event-bus";

export type AppEntry =
  | string
  | {
      scripts: string[];
      styles?: string[];
      html?: string;
    };

export type ActiveRule = string | ((location: Location) => boolean);

export interface AppConfig {
  name: string;
  entry: AppEntry;
  container?: string | HTMLElement;
  activeRule?: ActiveRule;
  route?: ActiveRule;
  keepAlive?: boolean;
  props?: Record<string, unknown>;
}

export interface AppConfigResolved extends Omit<AppConfig, "activeRule" | "route"> {
  activeRule: ActiveRule;
}

export interface AppProps {
  name: string;
  container: HTMLElement;
  eventBus: IEventBus;
  pathname: string;
  props?: Record<string, unknown>;
}

export interface AppLifecycles {
  bootstrap?: () => Promise<void>;
  mount: (props: AppProps) => Promise<void>;
  unmount: (props: AppProps) => Promise<void>;
  update?: (props: AppProps) => Promise<void>;
  onPause?: (props: AppProps) => Promise<void>;
  onResume?: (props: AppProps) => Promise<void>;
}

export type AppStatus =
  | "NOT_LOADED"
  | "LOADING"
  | "NOT_BOOTSTRAPPED"
  | "BOOTSTRAPPING"
  | "NOT_MOUNTED"
  | "MOUNTING"
  | "MOUNTED"
  | "UNMOUNTING"
  | "PAUSING"
  | "PAUSED"
  | "RESUMING"
  | "LOAD_ERROR";
