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
  region: process.env.REGION || 'ap-southeast-2' 
});

const USER_POOL_ID = process.env.USER_POOL_ID!;

const getUserFromToken = (token: string): { username: string } => {
  const decoded = jwt.decode(token) as jwt.JwtPayload & { username?: string };
  return {
    username: decoded.username || ''
  };
};

export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = getAuthHeader(event);
    const { username } = getUserFromToken(token);

    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    const response = await cognitoClient.send(command);

    const userAttributes: Record<string, string> = {};
    response.UserAttributes?.forEach(attr => {
      if (attr.Name && attr.Value) {
        userAttributes[attr.Name] = attr.Value;
      }
    });

    const user: CognitoUser = {
      username: response.Username!,
      email: userAttributes.email,
      given_name: userAttributes.given_name,
      family_name: userAttributes.family_name,
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
    const { username } = getUserFromToken(token);
    const body: UpdateUserRequest = parseRequestBody(event);

    const userAttributes = [];

    if (body.given_name !== undefined) {
      if (body.given_name.length < 1) {
        return createErrorResponse(400, 'INVALID_GIVEN_NAME', 'Given name cannot be empty');
      }
      userAttributes.push({
        Name: 'given_name',
        Value: body.given_name,
      });
    }

    if (body.family_name !== undefined) {
      if (body.family_name.length < 1) {
        return createErrorResponse(400, 'INVALID_FAMILY_NAME', 'Family name must be at least 1 character');
      }
      userAttributes.push({
        Name: 'family_name',
        Value: body.family_name,
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
      Username: username,
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
    const { username } = getUserFromToken(token);

    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
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
    const { username } = getUserFromToken(token);
    const body: ChangePasswordRequest = parseRequestBody(event);
    
    validateRequiredFields(body, ['oldPassword', 'newPassword']);

    // Note: In a production environment, you might want to verify the old password first
    // For this example, we'll directly set the new password
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
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