import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        tier: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        tier: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=users.service.d.ts.map