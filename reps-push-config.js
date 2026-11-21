// Safe-to-publish client configuration. Never add a VAPID private key here.
// To activate: deploy Firebase Functions, paste your PUBLIC VAPID key, and set enabled:true.
window.REPS_PUSH_CONFIG = Object.freeze({
  enabled: false,
  vapidPublicKey: '',
  manageEndpoint: 'https://asia-northeast3-review-stories-f251f.cloudfunctions.net/manageReviewPush',
  region: 'asia-northeast3'
});
