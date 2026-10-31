export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  href?: string;
}
export interface NotificationFeed {
  notifications: PlatformNotification[];
}
