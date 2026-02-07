import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface User extends IUser {}
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

export {};
