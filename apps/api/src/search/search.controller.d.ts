import { SearchService } from './search.service';
import { UsageService } from '../usage/usage.service';
export declare class SearchController {
    private searchService;
    private usageService;
    constructor(searchService: SearchService, usageService: UsageService);
    search(query: string, limit?: string, offset?: string, user: any): Promise<import("./search.service").SearchResult>;
}
//# sourceMappingURL=search.controller.d.ts.map