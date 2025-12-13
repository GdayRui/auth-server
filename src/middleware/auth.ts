import { APIGatewayProxyEvent } from 'aws-lambda';
import { ApiResponse, ErrorResponse, AppConfig } from '../types';
import { getAppConfig } from '../utils/ssm';

export const createResponse = <T>(
  statusCode: number,
  data: T | ErrorResponse,
  headers: Record<string, string> = {}
): ApiResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-App-ID',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers,
  },
  body: JSON.stringify(data),
});

export const createErrorResponse = (
  statusCode: number,
  error: string,
  message: string,
  details?: any
): ApiResponse => {
  return createResponse(statusCode, {
    error,
    message,
    details,
  });
};

export const parseRequestBody = <T>(event: APIGatewayProxyEvent): T => {
  try {
    return JSON.parse(event.body || '{}');
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

export const getAuthHeader = (event: APIGatewayProxyEvent): string => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header must be a Bearer token');
  }
  
  return authHeader.substring(7);
};

export const validateRequiredFields = (data: unknown, requiredFields: string[]): void => {
  const dataObj = data as Record<string, unknown>;
  const missingFields = requiredFields.filter(field => !dataObj[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

export const getAppIdFromHeader = (event: APIGatewayProxyEvent): string => {
  const appId = event.headers['X-App-ID'] || event.headers['x-app-id'];
  if (!appId) {
    throw new Error('X-App-ID header is required');
  }
  return appId;
};

export const getAppConfigFromEvent = async (event: APIGatewayProxyEvent): Promise<AppConfig> => {
  const appId = getAppIdFromHeader(event);
  const stage = process.env.STAGE || 'dev';
  
  try {
    const { userPoolId, userPoolClientId } = await getAppConfig(appId, stage);
    return {
      appId,
      userPoolId,
      userPoolClientId,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to retrieve app configuration');
  }
};