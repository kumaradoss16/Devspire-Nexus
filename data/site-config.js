/* Public browser configuration for the DevSpireHub AI Intelligence Directory.
   The Web3Forms access key only routes a form submission to its owner. It is
   visible in the page source by design and must never be treated as a secret.
   This repository intentionally ships with an empty key: forms validate
   locally and report that delivery is not configured instead of pretending
   to send. */
window.DSH_SITE_CONFIG = {
  web3formsAccessKey: '99ea5478-6d12-4190-bd08-d596eb363775',
  endpoint: 'https://api.web3forms.com/submit',
  requestTimeoutMs: 15000,
  subject: 'DevSpire Nexus resource submission',
  contactSubject: 'DevSpire Nexus contact message',
  duplicateWindowMs: 6 * 60 * 60 * 1000
};
