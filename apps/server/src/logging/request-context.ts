import { AsyncLocalStorage } from 'async_hooks';

export type AppSource = 'web' | 'mobile' | 'backend';

export interface RequestLogContext {
  app?: AppSource;
}

const requestLogContext = new AsyncLocalStorage<RequestLogContext>();

export function getRequestLogContext(): RequestLogContext | undefined {
  return requestLogContext.getStore();
}

export function getAppFromContext(): AppSource | undefined {
  return requestLogContext.getStore()?.app;
}

export function runWithRequestLogContext<T>(context: RequestLogContext, fn: () => T): T {
  return requestLogContext.run(context, fn);
}
