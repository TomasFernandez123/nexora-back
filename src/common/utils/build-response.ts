import { Request } from 'express';

export function buildResponse( success: boolean, message: string, data: any = null, req?: Request) {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    path: req?.url || null,
  };
}
