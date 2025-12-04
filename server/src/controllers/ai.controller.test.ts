import { Request, Response } from 'express';
import { generateContent } from './ai.controller';

const generateContentImpl = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: (...args: unknown[]) => generateContentImpl(...args),
      }),
    })),
  };
});

const createResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('generateContent controller', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  beforeEach(() => {
    generateContentImpl.mockReset();
  });

  it('returns generated text on success', async () => {
    generateContentImpl.mockResolvedValue({
      response: {
        text: () => 'Hello from Gemini',
      },
    });

    const req = {
      body: { prompt: 'Say hi' },
    } as Request;

    const res = createResponse();

    await generateContent(req, res);

    expect(generateContentImpl).toHaveBeenCalledWith('Say hi');

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      text: 'Hello from Gemini',
    });
  });

  it('returns 500 and error message when Gemini throws', async () => {
    generateContentImpl.mockRejectedValue(new Error('API down'));

    const req = {
      body: { prompt: 'Say hi' },
    } as Request;

    const res = createResponse();

    await generateContent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error generating content',
    });
  });
});
