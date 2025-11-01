export type User = { id: string; email: string; name: string };

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { email: string; password: string; name: string };

export type AuthSuccess = {
  success: true;
  message: string;
  token: string;
  user: User;
};

export type AuthError = {
  success: false;
  message: string;
};

export type AuthResponse = AuthSuccess | AuthError;

export type MeResponse =
  | { success: true; user: User }
  | { success: false; message: string };
