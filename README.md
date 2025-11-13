# Cognito Authentication Server

A serverless authentication server built with AWS Cognito, TypeScript, and the Serverless Framework. This service provides JWT-based authentication for multiple web applications with secure user management capabilities.

## Features

- **User Authentication**: Login, registration, and token refresh
- **User Management**: Profile management, password changes, and user deletion
- **Token Validation**: JWT token validation endpoints
- **AWS Cognito Integration**: Secure user pool management
- **Serverless Architecture**: Cost-effective AWS Lambda deployment
- **TypeScript**: Full type safety and better developer experience
- **CI/CD Pipeline**: GitHub Actions for automated deployment

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Token Validation
- `POST /token/validate` - Validate JWT token

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `DELETE /user/profile` - Delete user account
- `POST /user/change-password` - Change user password

## Setup

### Prerequisites
- Node.js 18.x or later
- AWS CLI configured with appropriate permissions
- Serverless Framework CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cognito-auth-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file for local development
cp .env.example .env
# Edit .env with your AWS Cognito settings
```

### Local Development

1. Start the development server:
```bash
npm run offline
```

2. Run tests:
```bash
npm test
```

3. Lint code:
```bash
npm run lint
```

### Deployment

#### Manual Deployment
```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

#### Automated Deployment
The project uses GitHub Actions for CI/CD:

- **Development**: Automatically deploys when pushing to `develop` branch
- **Production**: Automatically deploys when pushing to `main` branch

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

```
AWS_ACCESS_KEY_ID          # AWS access key
AWS_SECRET_ACCESS_KEY      # AWS secret key
AWS_REGION                 # AWS region (default: ap-southeast-2)
DEV_USER_POOL_ID          # Development Cognito User Pool ID
DEV_USER_POOL_CLIENT_ID   # Development Cognito Client ID
PROD_USER_POOL_ID         # Production Cognito User Pool ID
PROD_USER_POOL_CLIENT_ID  # Production Cognito Client ID
```

## API Usage Examples

### Registration
```bash
curl -X POST https://your-api-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Token Validation
```bash
curl -X POST https://your-api-url/token/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-jwt-token"
  }'
```

### Get User Profile
```bash
curl -X GET https://your-api-url/user/profile \
  -H "Authorization: Bearer your-jwt-token"
```

## Configuration

### AWS Cognito User Pool Settings

The serverless.yml file automatically creates:
- User Pool with email-based authentication
- Password policy requirements
- Email verification
- User Pool Client for API access

### Environment Variables

Required environment variables:
- `USER_POOL_ID`: AWS Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: AWS Cognito User Pool Client ID
- `REGION`: AWS region
- `STAGE`: Deployment stage (dev/prod)

## Security Considerations

1. **Token Validation**: Implement proper JWT signature verification using Cognito's JWKS endpoint
2. **HTTPS Only**: Always use HTTPS in production
3. **CORS**: Configure CORS settings appropriately for your client applications
4. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints
5. **Environment Variables**: Never commit sensitive credentials to version control

## Integration with Client Applications

Your web applications can integrate with this authentication server by:

1. Redirecting users to the authentication endpoints
2. Storing JWT tokens securely (HttpOnly cookies recommended)
3. Including tokens in Authorization headers for protected requests
4. Implementing token refresh logic before expiration

## Troubleshooting

### Common Issues

1. **Deployment Failures**: Ensure AWS credentials have sufficient permissions
2. **CORS Errors**: Update the CORS configuration in serverless.yml
3. **Token Validation**: Verify token format and expiration

### Debug Mode

Enable debug logging by setting:
```bash
export SLS_DEBUG=*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details