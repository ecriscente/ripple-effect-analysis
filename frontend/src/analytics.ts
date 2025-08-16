// Google Analytics utility functions

// Google Analytics is loaded in index.html, just use the global gtag function

// Track page views
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (!window.gtag) return;

  window.gtag('config', 'G-GDMS3BXY7R', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!window.gtag) {
    console.warn('gtag not available');
    return;
  }

  console.log('Tracking event:', eventName, parameters);
  window.gtag('event', eventName, {
    event_category: 'engagement',
    event_label: eventName,
    ...parameters,
  });
};

// Predefined event tracking functions
export const trackAnalysisSubmission = (technology: string, language: string) => {
  trackEvent('analysis_submission', {
    event_category: 'user_action',
    technology,
    language,
    value: 1,
  });
};

export const trackUserRegistration = (method: string) => {
  trackEvent('sign_up', {
    event_category: 'user_action',
    method,
  });
};

export const trackUserLogin = (method: string, userId?: string) => {
  // Set user ID for better tracking
  if (userId && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId
    });
  }
  
  trackEvent('login', {
    event_category: 'user_action',
    method,
  });
};

export const trackAnalysisView = (analysisId: string, technology: string) => {
  trackEvent('analysis_view', {
    event_category: 'content',
    analysis_id: analysisId,
    technology,
  });
};

export const trackThemeToggle = (theme: string) => {
  trackEvent('theme_toggle', {
    event_category: 'ui_interaction',
    theme,
  });
};

export const trackLanguageChange = (language: string) => {
  trackEvent('language_change', {
    event_category: 'ui_interaction',
    language,
  });
};