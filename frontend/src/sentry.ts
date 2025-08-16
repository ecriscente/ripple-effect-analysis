import * as Sentry from "@sentry/react";

// Sentry configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found in environment variables');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration({
        // Set tracing origins to connect Sentry with Request Performance
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/yourapp\.com\/api/,
        ],
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: `ripple-effect-analysis@${import.meta.env.VITE_APP_VERSION || 'dev'}`,
    // Additional options
    beforeSend(event) {
      // Filter out some errors in development
      if (ENVIRONMENT === 'development') {
        // Don't send certain development-only errors
        if (event.exception?.values?.some(v => 
          v.value?.includes('ResizeObserver loop limit exceeded')
        )) {
          return null;
        }
      }
      return event;
    },
  });

  console.log('Sentry initialized successfully');
};

// Error boundary for React components
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Manual error reporting functions
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// User context for better error tracking
export const setUserContext = (user: { id: string; email?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Performance monitoring
export const startTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({ name, op: operation });
};

// Breadcrumb for user actions
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};