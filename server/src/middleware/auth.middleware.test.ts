import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth.middleware';
import jwt from 'jsonwebtoken';
import User from '../models/User';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

const createResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  const mockedVerify = (jwt as any).verify as jest.Mock;
  const mockedUser = User as unknown as {
    findById: jest.Mock;
  };

  beforeEach(() => {
    mockedVerify.mockReset();
    mockedUser.findById.mockReset();
  });

  it('calls next and attaches user when token is valid', async () => {
    mockedVerify.mockReturnValue({ userId: '123', email: 'test@example.com' });

    const selectMock = jest.fn().mockResolvedValue({
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
    });

    mockedUser.findById.mockReturnValue({
      select: selectMock,
    });

    const req = {
      header: (name: string) =>
        name === 'Authorization' ? 'Bearer validtoken' : undefined,
    } as unknown as Request;

    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(mockedVerify).toHaveBeenCalledWith('validtoken', expect.any(String));
    expect(mockedUser.findById).toHaveBeenCalledWith('123');
    expect(selectMock).toHaveBeenCalledWith('-password');
    expect((req as any).user).toEqual(
      expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
      })
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no token is provided', async () => {
    const req = {
      header: () => undefined,
    } as unknown as Request;

    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No token provided',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = {
      header: (name: string) =>
        name === 'Authorization' ? 'Bearer badtoken' : undefined,
    } as unknown as Request;

    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
