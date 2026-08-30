let checkoutLoader;

export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (checkoutLoader) return checkoutLoader;

  checkoutLoader = new Promise((resolve) => {
    const existing = document.querySelector('script[data-campusshare-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.campusshareRazorpay = 'true';
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      checkoutLoader = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return checkoutLoader;
};
