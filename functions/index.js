'use strict';
// Reps push backend. Deploy separately to Firebase Cloud Functions (Blaze plan).
const crypto = require('node:crypto');
const {onRequest, onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const webpush = require('web-push');

initializeApp();
const db = getFirestore();
const REGION = 'asia-northeast3';
const ORIGIN = 'https://ryanpatricktoomey.github.io';
const TEACHER_UID = 'VWok43w84cbFLVdn7zB9NeTTVbG2';
const PUBLIC = defineSecret('REPS_VAPID_PUBLIC_KEY');
const PRIVATE = defineSecret('REPS_VAPID_PRIVATE_KEY');
const SUBSCRIPTIONS = 'reviewPushSubscriptions';
const ANNOUNCEMENTS = 'reviewPushAnnouncements';
const currentSeoulDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date());
const subId = endpoint => crypto.createHash('sha256').update(endpoint).digest('hex');

function validSubscription(sub) {
  if (!sub || typeof sub !== 'object' || Array.isArray(sub) ||
      typeof sub.endpoint !== 'string' || sub.endpoint.length > 1800 ||
      !sub.keys || typeof sub.keys.p256dh !== 'string' ||
      typeof sub.keys.auth !== 'string') return false;
  try {
    const url = new URL(sub.endpoint);
    // Only standard secure push service endpoints; never fetch arbitrary URLs.
    const host = url.hostname.toLowerCase();
    const permitted = host === 'fcm.googleapis.com' ||
      host === 'updates.push.services.mozilla.com' ||
      host === 'web.push.apple.com' ||
      host.endsWith('.push.apple.com') ||
      host === 'wns2-pn1p.notify.windows.com' ||
      host.endsWith('.notify.windows.com') ||
      host === 'push.services.mozilla.com';
    return url.protocol === 'https:' && permitted &&
      sub.keys.p256dh.length >= 40 && sub.keys.p256dh.length <= 180 &&
      sub.keys.auth.length >= 12 && sub.keys.auth.length <= 100;
  } catch (_) { return false; }
}

exports.manageReviewPush = onRequest({
  region:REGION,
  cors:[ORIGIN],
  maxInstances:10,
  memory:'256MiB'
}, async (req,res) => {
  res.set('Cache-Control','no-store');
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if(req.get('origin') !== ORIGIN) return res.status(403).json({error:'Invalid origin'});
  if(Number(req.get('content-length')||0)>6500) return res.status(413).json({error:'Payload too large'});
  const {action,subscription} = req.body || {};
  if(!['subscribe','unsubscribe'].includes(action)||!validSubscription(subscription))
    return res.status(400).json({error:'Invalid push subscription'});
  const id = subId(subscription.endpoint);
  const ref = db.collection(SUBSCRIPTIONS).doc(id);
  try {
    if(action === 'subscribe') {
      await ref.set({
        subscription:{
          endpoint:subscription.endpoint,
          keys:{p256dh:subscription.keys.p256dh,auth:subscription.keys.auth}
        },
        updatedAt:FieldValue.serverTimestamp()
      });
    } else {
      await ref.delete();
    }
    return res.json({ok:true});
  } catch(err) {
    console.error('Subscription update failed',err);
    return res.status(503).json({error:'Subscription unavailable'});
  }
});

function ensureTeacher(request) {
  if(!request.auth || request.auth.uid !== TEACHER_UID)
    throw new HttpsError('permission-denied','Only the Reps teacher can send announcements.');
}

exports.reviewPushStatus = onCall({region:REGION}, async request => {
  ensureTeacher(request);
  const day = currentSeoulDate();
  const snap = await db.collection(ANNOUNCEMENTS).doc(day).get();
  return {day,sent:snap.exists,...(snap.exists?{
    state:snap.get('state')||'processing',
    delivered:snap.get('delivered')||0,
    failed:snap.get('failed')||0
  }:{})};
});

exports.sendReviewReady = onCall({
  region:REGION,
  timeoutSeconds:540,
  memory:'512MiB',
  secrets:[PUBLIC,PRIVATE]
}, async request => {
  ensureTeacher(request);
  const day = currentSeoulDate();
  const ref = db.collection(ANNOUNCEMENTS).doc(day);
  // Atomic create: two clicks, two tabs, or two concurrent requests cannot double-send.
  try {
    await ref.create({day,state:'sending',startedAt:FieldValue.serverTimestamp(),initiatedBy:TEACHER_UID});
  } catch(err) {
    if(err.code === 6 || err.code === 'already-exists') throw new HttpsError('already-exists','Today’s announcement was already started.');
    throw err;
  }
  let delivered=0, failed=0, removed=0, total=0;
  try {
    webpush.setVapidDetails(ORIGIN,PUBLIC.value(),PRIVATE.value());
    // The subscription collection is server-only; never disclose tokens to clients.
    const snap = await db.collection(SUBSCRIPTIONS).get();
    total=snap.size;
    const payload = JSON.stringify({
      title:'📚 Today’s Reviews Are Ready!',
      body:'오늘의 복습 자료가 모두 올라왔어요! 복습하러 오세요.',
      url:'./index.html#review-stories',
      tag:'reps-daily-review-'+day
    });
    const docs=snap.docs;
    for(let offset=0;offset<docs.length;offset+=30){
      const chunk=docs.slice(offset,offset+30);
      await Promise.all(chunk.map(async doc=>{
        try {
          await webpush.sendNotification(doc.data().subscription,payload,{TTL:12*60*60,urgency:'normal'});
          delivered++;
        } catch(err){
          failed++;
          if(err.statusCode===404||err.statusCode===410){
            removed++;
            await doc.ref.delete().catch(()=>{});
          } else {
            console.warn('Push delivery rejected',err.statusCode||err.message);
          }
        }
      }));
    }
    await ref.update({state:failed?'partial':'sent',delivered,failed,removed,total,finishedAt:FieldValue.serverTimestamp()});
    return {day,delivered,failed,removed,total};
  }catch(err){
    await ref.update({state:'error',delivered,failed,total,error:'See Firebase Functions logs',finishedAt:FieldValue.serverTimestamp()}).catch(()=>{});
    console.error('Daily review announcement failed',err);
    throw new HttpsError('internal','Unable to complete notification delivery. Check Firebase Functions logs before retrying.');
  }
});
