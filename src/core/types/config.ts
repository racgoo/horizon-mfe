import type { AppConfig, ActiveRule } from "./app";

export interface HorizonConfig {
  beforeMount?: (app: AppConfig) => Promise<boolean | void>;
  afterMount?: (app: AppConfig) => Promise<void>;
  beforeUnmount?: (app: AppConfig) => Promise<void>;
  afterUnmount?: (app: AppConfig) => Promise<void>;
  onPause?: (app: AppConfig) => Promise<void>;
  onResume?: (app: AppConfig) => Promise<void>;
  exposeNavigate?: boolean;
  onRouteChange?: () => void;
}

export type CreateHorizonAppConfig = Pick<
  AppConfig,
  "name" | "entry" | "container" | "keepAlive" | "props"
> & {
  route?: ActiveRule;
  activeRule?: ActiveRule;
};

export interface CreateHorizonOptions {
  apps: CreateHorizonAppConfig[];
  container?: string | HTMLElement;
  keepAlive?: boolean;
  onMount?: (app: AppConfig) => Promise<void>;
  onUnmount?: (app: AppConfig) => Promise<void>;
  onPause?: (app: AppConfig) => Promise<void>;
  onResume?: (app: AppConfig) => Promise<void>;
  exposeNavigate?: boolean;
  onRouteChange?: () => void;
}
