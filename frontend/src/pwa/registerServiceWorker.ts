/**
 * Service Worker Registration & Lifecycle Manager
 */

export interface ServiceWorkerRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(callbacks?: ServiceWorkerRegistrationCallbacks): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .then((registration) => {
        // Registration successful
        callbacks?.onSuccess?.(registration);

        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                callbacks?.onUpdate?.(registration);
                window.dispatchEvent(
                  new CustomEvent('careerbridge-sw-update', { detail: registration })
                );
              }
            }
          };
        };
      })
      .catch((error) => {
        callbacks?.onError?.(error);
        console.warn('[PWA] Service worker registration failed:', error);
      });
  });
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
