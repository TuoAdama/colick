export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: UserResponse;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface GoogleAuthConfig {
  enabled: boolean;
  clientId?: string;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: string;
  hasPassword?: boolean;
}

/** Payload for updating basic profile info (no email/password via this request). */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
