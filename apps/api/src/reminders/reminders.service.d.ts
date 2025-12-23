import { PrismaService } from '../prisma/prisma.service';
export declare class RemindersService {
    private prisma;
    constructor(prisma: PrismaService);
    getInbox(userId: string): Promise<{
        unreadCount: number;
        reminders: {
            reminderId: string;
            memoryId: string;
            memoryPreview: string;
            memoryType: import("@prisma/client").$Enums.MemoryType;
            hasImage: boolean;
            scheduledAt: Date;
            sentAt: Date;
            readAt: Date;
        }[];
    }>;
    markAsRead(userId: string, reminderId: string): Promise<{
        success: boolean;
    }>;
    dismiss(userId: string, reminderId: string): Promise<{
        success: boolean;
    }>;
    private truncateText;
}
//# sourceMappingURL=reminders.service.d.ts.map