import { Request, Response } from 'express';
import { login, getProfile } from './auth.controller';
import User from '../models/User';
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const createResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth controller', () => {
  const mockedUser = User as unknown as {
    findOne: jest.Mock;
  };

  beforeEach(() => {
    mockedUser.findOne.mockReset();
  });

  it('getProfile returns current user from req.user', async () => {
    const req = {
      user: { id: '123', email: 'test@example.com' },
    } as Request;

    const res = createResponse();

    await getProfile(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: { id: '123', email: 'test@example.com' },
    });
  });

  it('returns 500 when login has an internal error', async () => {
    mockedUser.findOne.mockImplementation(() => {
      throw new Error('DB failure');
    });

    const req = {
      body: { email: 'test@example.com', password: 'password123' },
    } as Request;

    const res = createResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Server error during login',
    });
  });
});
