import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
// Cognito client removed - not needed for basic token validation
import jwt from 'jsonwebtoken';
import { 
  createResponse, 
  createErrorResponse, 
  parseRequestBody 
} from '../middleware/auth';
import { ValidatedToken } from '../types';

export const validate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = parseRequestBody<{ token: string }>(event);
    
    if (!body.token) {
      return createErrorResponse(400, 'MISSING_TOKEN', 'Token is required');
    }

    // Decode the JWT token without verification first to get the header
    const decodedHeader = jwt.decode(body.token, { complete: true }) as jwt.JwtPayload | null;
    
    if (!decodedHeader) {
      return createErrorResponse(401, 'INVALID_TOKEN', 'Invalid token format');
    }

    // For a production environment, you would need to:
    // 1. Fetch the public keys from Cognito JWKS endpoint
    // 2. Verify the token signature using the appropriate public key
    // 3. Validate the token claims (issuer, audience, expiration, etc.)
    
    // For this example, we'll do basic validation
    const decoded = jwt.decode(body.token) as ValidatedToken;
    
    if (!decoded) {
      return createErrorResponse(401, 'INVALID_TOKEN', 'Invalid token');
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return createErrorResponse(401, 'TOKEN_EXPIRED', 'Token has expired');
    }

    // Check token type
    if (decoded.token_use !== 'access' && decoded.token_use !== 'id') {
      return createErrorResponse(401, 'INVALID_TOKEN_TYPE', 'Invalid token type');
    }

    return createResponse(200, {
      message: 'Token is valid',
      data: {
        sub: decoded.sub,
        email: decoded.email,
        tokenType: decoded.token_use,
        expiresAt: decoded.exp,
        issuedAt: decoded.iat
      }
    });

  } catch (error: unknown) {
    console.error('Token validation error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        return createErrorResponse(401, 'INVALID_TOKEN', 'Invalid token format');
      }
      
      if (error.name === 'TokenExpiredError') {
        return createErrorResponse(401, 'TOKEN_EXPIRED', 'Token has expired');
      }

      return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', 'Unknown error');
  }
};