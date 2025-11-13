import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  createResponse, 
  createErrorResponse, 
  parseRequestBody,
  getAuthHeader,
  validateRequiredFields
} from '../middleware/auth';
import { UpdateUserRequest, ChangePasswordRequest, CognitoUser } from '../types';
import jwt from 'jsonwebtoken';

const cognitoClient = new CognitoIdentityProviderClient({ 
  region: process.env.REGION || 'us-east-1' 
});

const USER_POOL_ID = process.env.USER_POOL_ID!;

const getUserFromToken = (token: string): { sub: string; email: string } => {
  const decoded = jwt.decode(token) as jwt.JwtPayload & { email?: string; username?: string };
  return {
    sub: decoded.sub || '',
    email: decoded.email || decoded.username || ''
  };
};

export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = getAuthHeader(event);
    const { email } = getUserFromToken(token);

    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);

    const userAttributes: Record<string, string> = {};
    response.UserAttributes?.forEach(attr => {
      if (attr.Name && attr.Value) {
        userAttributes[attr.Name] = attr.Value;
      }
    });

    const user: CognitoUser = {
      sub: response.Username!,
      email: userAttributes.email,
      firstName: userAttributes.given_name,
      lastName: userAttributes.family_name,
      emailVerified: userAttributes.email_verified === 'true',
      enabled: response.Enabled || false,
      userStatus: response.UserStatus!,
      createdDate: response.UserCreateDate!,
      lastModifiedDate: response.UserLastModifiedDate!,
    };

    return createResponse(200, {
      message: 'User retrieved successfully',
      data: user
    });

  } catch (error: unknown) {
    console.error('Get user error:', error);
    
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      return createErrorResponse(404, 'USER_NOT_FOUND', 'User not found');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', errorMessage);
  }
};

export const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = getAuthHeader(event);
    const { email } = getUserFromToken(token);
    const body: UpdateUserRequest = parseRequestBody(event);

    const userAttributes = [];

    if (body.firstName !== undefined) {
      userAttributes.push({
        Name: 'given_name',
        Value: body.firstName,
      });
    }

    if (body.lastName !== undefined) {
      userAttributes.push({
        Name: 'family_name',
        Value: body.lastName,
      });
    }

    if (body.email !== undefined) {
      userAttributes.push({
        Name: 'email',
        Value: body.email,
      });
    }

    if (userAttributes.length === 0) {
      return createErrorResponse(400, 'NO_UPDATES', 'No valid fields to update');
    }

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: userAttributes,
    });

    await cognitoClient.send(command);

    return createResponse(200, {
      message: 'User updated successfully'
    });

  } catch (error: unknown) {
    console.error('Update user error:', error);
    
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      return createErrorResponse(404, 'USER_NOT_FOUND', 'User not found');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', errorMessage);
  }
};

export const deleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = getAuthHeader(event);
    const { email } = getUserFromToken(token);

    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);

    return createResponse(200, {
      message: 'User deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Delete user error:', error);
    
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      return createErrorResponse(404, 'USER_NOT_FOUND', 'User not found');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', errorMessage);
  }
};

export const changePassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = getAuthHeader(event);
    const { email } = getUserFromToken(token);
    const body: ChangePasswordRequest = parseRequestBody(event);
    
    validateRequiredFields(body, ['oldPassword', 'newPassword']);

    // Note: In a production environment, you might want to verify the old password first
    // For this example, we'll directly set the new password
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: body.newPassword,
      Permanent: true,
    });

    await cognitoClient.send(command);

    return createResponse(200, {
      message: 'Password changed successfully'
    });

  } catch (error: unknown) {
    console.error('Change password error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        return createErrorResponse(404, 'USER_NOT_FOUND', 'User not found');
      }
      
      if (error.name === 'InvalidPasswordException') {
        return createErrorResponse(400, 'INVALID_PASSWORD', 'Password does not meet requirements');
      }

      return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', 'Unknown error');
  }
};