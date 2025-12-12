import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  createResponse, 
  createErrorResponse, 
  parseRequestBody,
  validateRequiredFields
} from '../middleware/auth';
import { AuthRequest, RegisterRequest, RefreshTokenRequest, AuthResponse } from '../types';

const cognitoClient = new CognitoIdentityProviderClient({ 
  region: process.env.REGION || 'ap-southeast-2' 
});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: AuthRequest = parseRequestBody(event);
    validateRequiredFields(body, ['username', 'password']);

    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: body.username,
        PASSWORD: body.password,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return createErrorResponse(401, 'AUTHENTICATION_FAILED', 'Invalid credentials');
    }

    const authResponse: AuthResponse = {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn!,
      tokenType: response.AuthenticationResult.TokenType!,
    };

    return createResponse(200, { 
      message: 'Login successful',
      data: authResponse 
    });

  } catch (error: unknown) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'UserNotConfirmedException') {
        return createErrorResponse(400, 'USER_NOT_CONFIRMED', 'User email not confirmed');
      }
      
      if (error.name === 'NotAuthorizedException') {
        return createErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      
      if (error.name === 'UserNotFoundException') {
        return createErrorResponse(404, 'USER_NOT_FOUND', 'User not found');
      }

      return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', 'Unknown error');
  }
};

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: RegisterRequest = parseRequestBody(event);
    validateRequiredFields(body, ['username', 'password', 'given_name', 'family_name']);

    // Validate family_name minimum 1 character
    if (body.family_name.length < 1) {
      return createErrorResponse(400, 'INVALID_FAMILY_NAME', 'Family name must be at least 1 character');
    }

    const userAttributes = [
      {
        Name: 'given_name',
        Value: body.given_name,
      },
      {
        Name: 'family_name',
        Value: body.family_name,
      },
    ];

    if (body.email) {
      userAttributes.push({
        Name: 'email',
        Value: body.email,
      });
    }

    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: body.username,
      UserAttributes: userAttributes,
      MessageAction: MessageActionType.SUPPRESS,
      TemporaryPassword: body.password,
    });

    await cognitoClient.send(createCommand);

    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: body.username,
      Password: body.password,
      Permanent: true,
    });

    await cognitoClient.send(setPasswordCommand);

    return createResponse(201, {
      message: 'User registered successfully',
      data: { username: body.username }
    });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'UsernameExistsException') {
        return createErrorResponse(409, 'USER_EXISTS', 'User already exists');
      }
      
      if (error.name === 'InvalidPasswordException') {
        return createErrorResponse(400, 'INVALID_PASSWORD', 'Password does not meet requirements');
      }

      return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', 'Unknown error');
  }
};

export const refreshToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: RefreshTokenRequest = parseRequestBody(event);
    validateRequiredFields(body, ['refreshToken']);

    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: body.refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return createErrorResponse(401, 'REFRESH_FAILED', 'Invalid refresh token');
    }

    const authResponse: Partial<AuthResponse> = {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn!,
      tokenType: response.AuthenticationResult.TokenType!,
    };

    return createResponse(200, {
      message: 'Token refreshed successfully',
      data: authResponse
    });

  } catch (error: unknown) {
    console.error('Refresh token error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        return createErrorResponse(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
      }

      return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', 'Unknown error');
  }
};

export const logout = async (): Promise<APIGatewayProxyResult> => {
  try {
    // For Cognito, logout is primarily handled client-side by discarding tokens
    // Here we can add any server-side cleanup if needed
    
    return createResponse(200, {
      message: 'Logout successful'
    });

  } catch (error: unknown) {
    console.error('Logout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', errorMessage);
  }
};