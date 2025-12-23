import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionsService } from './sessions/sessions.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private sessionsService;
    private prisma;
    private config;
    constructor(usersService: UsersService, jwtService: JwtService, sessionsService: SessionsService, prisma: PrismaService, config: ConfigService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            tier: any;
            roles: any;
        };
    }>;
    signup(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            tier: any;
            roles: any;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
}
//# sourceMappingURL=auth.service.d.ts.map