/**
 * Public App Permissions Manager for Ankita AI Assistant
 * Provides unified tracking and one-click granting for all browser & mobile permissions:
 * - Microphone (Audio & Voice Recognition)
 * - Camera (Torch & Visual HUD)
 * - Geolocation (GPS & Local Weather/City Info)
 * - Notifications (System Alerts & Reminders)
 * - Clipboard (Code & Chat Copy/Paste)
 * - Screen Wake Lock (Keep Display On)
 * - Audio Playback / Autoplay
 */

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissionItem {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  state: PermissionState;
  isRequired: boolean;
}

export interface PermissionsSummary {
  microphone: PermissionState;
  camera: PermissionState;
  geolocation: PermissionState;
  notifications: PermissionState;
  clipboard: PermissionState;
  wakeLock: PermissionState;
  allEssentialGranted: boolean;
}

/**
 * Check state of an individual browser permission
 */
async function queryPermission(name: any): Promise<PermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'prompt';
  }
  try {
    const status = await navigator.permissions.query({ name });
    return status.state as PermissionState;
  } catch {
    return 'prompt';
  }
}

/**
 * Get comprehensive permissions summary for the public app
 */
export async function checkAllPermissions(): Promise<PermissionsSummary> {
  let mic: PermissionState = 'prompt';
  let cam: PermissionState = 'prompt';
  let geo: PermissionState = 'prompt';
  let notif: PermissionState = 'prompt';
  let clip: PermissionState = 'prompt';
  let wake: PermissionState = 'prompt';

  // 1. Microphone
  try {
    mic = await queryPermission('microphone');
  } catch {
    mic = 'prompt';
  }

  // 2. Camera
  try {
    cam = await queryPermission('camera');
  } catch {
    cam = 'prompt';
  }

  // 3. Geolocation
  try {
    geo = await queryPermission('geolocation');
  } catch {
    geo = 'prompt';
  }

  // 4. Notifications
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') notif = 'granted';
    else if (Notification.permission === 'denied') notif = 'denied';
    else notif = 'prompt';
  } else {
    notif = 'unsupported';
  }

  // 5. Clipboard
  try {
    clip = await queryPermission('clipboard-read');
  } catch {
    clip = typeof navigator?.clipboard !== 'undefined' ? 'granted' : 'prompt';
  }

  // 6. Wake Lock
  wake = typeof navigator !== 'undefined' && 'wakeLock' in navigator ? 'prompt' : 'unsupported';

  const allEssentialGranted = mic === 'granted';

  return {
    microphone: mic,
    camera: cam,
    geolocation: geo,
    notifications: notif,
    clipboard: clip,
    wakeLock: wake,
    allEssentialGranted,
  };
}

/**
 * Request Microphone permission directly
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately after granting
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Microphone permission request error:', err);
    return false;
  }
}

/**
 * Request Camera permission directly
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Camera permission request error:', err);
    return false;
  }
}

/**
 * Request Geolocation permission directly
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return false;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 8000 }
    );
  });
}

/**
 * Request Notification permission directly
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') {
    return false;
  }
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

/**
 * Request Screen Wake Lock to keep screen awake during interaction
 */
let activeWakeLock: any = null;
export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }
  try {
    activeWakeLock = await (navigator as any).wakeLock.request('screen');
    return true;
  } catch {
    return false;
  }
}

/**
 * Master 1-Click Request: Prompts essential public app permissions in sequence
 */
export async function requestAllPublicPermissions(): Promise<PermissionsSummary> {
  // 1. Microphone (Highest priority for speech)
  await requestMicrophonePermission();

  // 2. Notifications (For mobile reminders/alerts)
  await requestNotificationPermission();

  // 3. Geolocation (For local weather & navigation)
  await requestGeolocationPermission();

  // 4. Wake Lock (Keep phone screen on)
  await requestScreenWakeLock();

  return await checkAllPermissions();
}
