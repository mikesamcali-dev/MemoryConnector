import { UsageService } from '../usage/usage.service';
export declare class MemoriesController {
    private usageService;
    constructor(usageService: UsageService);
    createMemory(userId: string, createMemoryDto: CreateMemoryDto): Promise<any>;
    search(userId: string, query: string): Promise<any>;
}
//# sourceMappingURL=USAGE_EXAMPLE.d.ts.map