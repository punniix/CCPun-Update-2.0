(() => {
  const PIXEL_ID = '1749497202896744';
  const SCRIPT_ID = 'meta-pixel-script';
  if (window.__ccpunMetaPixelBase) return;
  window.__ccpunMetaPixelBase = true;

  let initialized = false;
  let previousPath = window.location.pathname;

  function hasConsent() {
    try {
      return JSON.parse(localStorage.getItem('ccpun_cookie_consent') || 'null')?.social === true;
    } catch {
      return false;
    }
  }

  function createFbq() {
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    return fbq;
  }

  function trackPage() {
    if (!initialized || !hasConsent()) return;
    window.fbq('track', 'PageView');
    if (window.location.pathname.startsWith('/ci-planning')) {
      window.fbq('track', 'ViewContent', {
        content_name: 'CI Planning Tool',
        content_category: 'Financial Planning Tool',
      });
    }
  }

  function load() {
    if (!hasConsent()) return;
    if (initialized) {
      window.fbq?.('consent', 'grant');
      return;
    }
    if (!window.fbq) {
      window.fbq = createFbq();
      window._fbq = window.fbq;
    }
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    window.fbq('consent', 'grant');
    window.fbq('init', PIXEL_ID);
    initialized = true;
    trackPage();
  }

  function disable() {
    window.fbq?.('consent', 'revoke');
    document.getElementById(SCRIPT_ID)?.remove();
    for (const name of ['_fbp', '_fbc']) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
    delete window.fbq;
    delete window._fbq;
    initialized = false;
  }

  function routeChanged() {
    if (previousPath === window.location.pathname) return;
    previousPath = window.location.pathname;
    trackPage();
  }

  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function () {
      const result = original.apply(this, arguments);
      queueMicrotask(routeChanged);
      return result;
    };
  }
  window.addEventListener('popstate', routeChanged);
  window.addEventListener('ccpun:consent', (event) => {
    if (event.detail?.social === true) load();
    else disable();
  });
  load();
})();
