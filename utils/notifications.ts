import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { darkTheme } from '../constants/colors';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permission for notifications
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Timre Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: darkTheme.accent,
    });
  }

  return true;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule morning reminder
export async function scheduleMorningReminder(hour = 8, minute = 0): Promise<void> {
  // Cancel existing morning notifications first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'morning') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning! ☀️',
      body: 'Set your intentions for today and start strong.',
      data: { type: 'morning', screen: 'MorningCheckIn' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

// Schedule evening review reminder (1 hour before bedtime)
export async function scheduleEveningReminder(bedtimeHour: number, bedtimeMinute: number): Promise<void> {
  // Cancel existing evening notifications first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'evening') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Calculate 1 hour before bedtime
  let reminderHour = bedtimeHour - 1;
  const reminderMinute = bedtimeMinute;

  if (reminderHour < 0) {
    reminderHour = 23;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Evening Review ✨',
      body: 'Time to recap your day and complete your streak!',
      data: { type: 'evening', screen: 'EveningReview' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: reminderHour,
      minute: reminderMinute,
      repeats: true,
    },
  });
}

// Schedule both reminders based on settings
export async function scheduleAllReminders(
  morningHour: number,
  morningMinute: number,
  bedtime: string,
): Promise<void> {
  const [bedtimeHour, bedtimeMinute] = bedtime.split(':').map(n => parseInt(n, 10));
  await scheduleMorningReminder(morningHour, morningMinute);
  await scheduleEveningReminder(bedtimeHour, bedtimeMinute);
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
