export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  given_name: string;
  family_name: string;
  email?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  given_name?: string;
  family_name?: string;
  email?: string;
}

export interface CognitoUser {
  username: string;
  email?: string;
  given_name: string;
  family_name: string;
  emailVerified?: boolean;
  enabled: boolean;
  userStatus: string;
  createdDate: Date;
  lastModifiedDate: Date;
}

export interface AuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface ApiResponse {
  statusCode: number;
  body: string;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
  };
}

export interface ValidatedToken {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  token_use: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}