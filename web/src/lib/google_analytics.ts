interface GAEventParameters {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameter?: string;
  [key: string]: string | number | boolean | undefined;
}

// interface GAConfigParameters {
//   page_path?: string;
//   page_title?: string;
//   page_location?: string;
//   [key: string]: string | number | boolean | undefined;
// }

export const initializeGA = (): void => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string;

  if (!measurementId) {
    return;
  }

  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(gtagScript);

  // gtagの初期化
  // window.dataLayer = window.dataLayer || [];
  // function gtag(
  //   command: 'config' | 'event' | 'js',
  //   targetId: string | Date,
  //   config?: GAConfigParameters | GAEventParameters
  // ) {
  //   window.dataLayer.push([command, targetId, config]);
  // }
  // window.gtag = gtag;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };

  gtagScript.onload = () => {
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });
  };
};

export const sendPageView = (path: string, title?: string): void => {
  if (!window.gtag) {
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string;

  window.gtag('config', measurementId, {
    page_path: path,
    page_title: title || document.title,
  });
};

export const sendGAEvent = (eventName: string, parameters: GAEventParameters = {}): void => {
  if (!window.gtag) {
    return;
  }
  window.gtag('event', eventName, parameters);
};

export const trackButtonClick = (buttonName: string): void => {
  sendGAEvent('click', {
    event_category: 'engagement',
    event_label: buttonName,
  });
};

export const trackExternalLink = (url: string): void => {
  sendGAEvent('click', {
    event_category: 'outbound_link',
    event_label: url,
  });
};
