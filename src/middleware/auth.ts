import { APIGatewayProxyEvent } from 'aws-lambda';
import { ApiResponse, ErrorResponse } from '../types';

export const createResponse = <T>(
  statusCode: number,
  data: T | ErrorResponse,
  headers: Record<string, string> = {}
): ApiResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
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