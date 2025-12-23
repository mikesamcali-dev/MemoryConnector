import { ConfigService } from '@nestjs/config';
interface AlertOptions {
    channel: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    details?: Record<string, any>;
}
export declare class AlertingService {
    private config;
    constructor(config: ConfigService);
    alertSlack(options: AlertOptions): Promise<void>;
}
export {};
//# sourceMappingURL=alerting.service.d.ts.map