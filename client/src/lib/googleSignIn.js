/** Single global GSI init — avoids "initialize() called multiple times" warnings. */

let scriptPromise = null;
let initializedClientId = null;

export function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.id) resolve();
      else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', reject);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Initialize GSI once per client id. Returns true if initialize ran (or already matched).
 */
export async function ensureGoogleSignInInitialized(clientId, onCredential) {
  if (!clientId) return false;
  await loadGoogleIdentityScript();
  if (!window.google?.accounts?.id) {
    throw new Error('Google Sign-In unavailable');
  }

  if (initializedClientId === clientId) return false;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response?.credential) onCredential(response.credential);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
  });

  initializedClientId = clientId;
  return true;
}

export function renderHiddenGoogleButton(container, options = {}) {
  if (!container || !window.google?.accounts?.id) return;
  container.innerHTML = '';
  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: options.text || 'signin_with',
    shape: options.shape || 'pill',
    width: options.width || 400,
    logo_alignment: 'left',
  });
}

export function clickGoogleSignInButton(container) {
  const btn =
    container?.querySelector('[role="button"]') ||
    container?.querySelector('div[tabindex="0"]');
  btn?.click();
}
