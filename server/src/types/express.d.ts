declare global {
  namespace Express {
    interface User extends IUser { }
    interface Request {
      user?: import('../models/User').IUser;
      userId?: string;
    }
  }
}

export {};
