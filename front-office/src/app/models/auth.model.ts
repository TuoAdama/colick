export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  identityDocument: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  identityDocument?: string;
  photoUrl?: string;
  role: string;
}

/** Payload for updating basic profile info (no email/password via this request). */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  identityDocument?: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
