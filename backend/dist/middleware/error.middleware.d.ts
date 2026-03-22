import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}
export declare class CustomError extends Error implements AppError {
    statusCode: number;
    code: string;
    details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
}
export declare function errorHandler(err: AppError | Error, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function notFoundHandler(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map