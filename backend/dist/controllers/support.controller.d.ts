import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class SupportController {
    createTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listTickets(req: any, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getTicket(req: any, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateTicket(req: any, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: SupportController;
export default _default;
//# sourceMappingURL=support.controller.d.ts.map