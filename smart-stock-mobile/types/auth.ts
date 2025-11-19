

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name?: string;
};

// Returned by /api/auth/login and /api/auth/register
export type AuthResponse = {
  success: boolean;
  message?: string;
  token: string;
  user: User;
};

// Returned by /api/auth/me
export type MeResponse = {
  success: boolean;
  user: User;
};
