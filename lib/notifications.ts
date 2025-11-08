/**
 * Notification utilities for the application
 */

// Play notification sound
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  
  try {
    // Use Web Audio API to create a simple notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant notification tone (C note)
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
}

// Show browser notification
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }
  
  const notification = new Notification(title, {
    icon: '/icon.svg',
    badge: '/icon.svg',
    requireInteraction: false,
    ...options,
  });
  
  return notification;
}

// Check if notifications are supported
export function areNotificationsSupported(): boolean {
  return 'Notification' in window;
}

// Check if notifications are granted
export function areNotificationsGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

