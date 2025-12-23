import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private authService;
    private config;
    constructor(authService: AuthService, config: ConfigService);
    signup(signupDto: SignupDto, res: Response): Promise<Response<any, Record<string, any>>>;
    login(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    refresh(req: Request): Promise<{
        accessToken: string;
    }>;
    logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getMe(req: any): Promise<any>;
}
//# sourceMappingURL=auth.controller.d.ts.map