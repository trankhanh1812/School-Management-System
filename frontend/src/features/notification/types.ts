export type NotificationAudience = "all" | "admin" | "teacher" | "student" | "parent" | "class";

export type NotificationTypeCode =
	| "SCORE_UPDATE"
	| "ATTENDANCE"
	| "SCHEDULE_CHANGE"
	| "EVENT"
	| "ANNOUNCEMENT"
	| "SYSTEM";

export type NotificationChannel = "APP" | "EMAIL" | "SMS";

export type NotificationRecord = {
	notificationId: string;
	title: string;
	message: string;
	notificationType: NotificationTypeCode | string;
	channel: NotificationChannel | string;
	sentAt?: string;
	createdAt?: string;
	readAt?: string | null;
	read: boolean;
};

export type NotificationCreatePayload = {
	title: string;
	message: string;
	notificationType: NotificationTypeCode;
	channel: NotificationChannel;
	audience: NotificationAudience;
	classCodes?: string[];
};

export type NotificationListPayload = {
	items: NotificationRecord[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
	unreadCount: number;
};

export type NotificationAudienceClass = {
	classCode: string;
	className: string;
};

export type NotificationUnreadCountPayload = {
	unreadCount: number;
};
