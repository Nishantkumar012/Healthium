export interface JWTPayload {
  userId: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  iat: number;
  exp: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'patient' | 'doctor';
}

export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    mfaEnabled: boolean;
  };
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
}

export interface VerifyMFARequest {
  totpCode: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
