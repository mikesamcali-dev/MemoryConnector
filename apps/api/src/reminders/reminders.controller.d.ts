import { RemindersService } from './reminders.service';
export declare class RemindersController {
    private remindersService;
    constructor(remindersService: RemindersService);
    getInbox(user: any): Promise<{
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
    markAsRead(id: string, user: any): Promise<{
        success: boolean;
    }>;
    dismiss(id: string, user: any): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=reminders.controller.d.ts.map