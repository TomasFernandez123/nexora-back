import { Request } from 'express';

export interface JwtPayload {
  id: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
