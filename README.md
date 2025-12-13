# Cognito Authentication Server

A serverless authentication server built with AWS Cognito, TypeScript, and the Serverless Framework. This service provides JWT-based authentication for multiple web applications with secure user management capabilities.

## Features

- **Multi-App Support**: One auth server serving multiple isolated applications
- **Username-Based Authentication**: Login with username/password (email optional)
- **User Management**: Profile management with customizable attributes
- **Self-Service Password Changes**: Users can change their own passwords when logged in
- **Token Validation**: JWT token validation endpoints
- **AWS Cognito Integration**: Dedicated User Pool per application
- **SSM Parameter Store**: Dynamic app configuration without redeployment
- **Complete Isolation**: Users in one app cannot access another app
- **Serverless Architecture**: Cost-effective AWS Lambda deployment
- **Two-Stack Architecture**: Separate infrastructure and application deployments
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

#### Deploy Infrastructure (Per App)

Deploy infrastructure once for each application:

```bash
# Deploy User Pool for kids-chat app
serverless deploy --config serverless-infrastructure.yml --stage dev --param="appName=kids-chat"

# Deploy User Pool for another app
serverless deploy --config serverless-infrastructure.yml --stage dev --param="appName=todo-app"
```

#### Deploy Application

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

**Note**: The application stack is deployed once and serves all apps dynamically based on the `X-App-ID` header.

#### Automated Deployment
The project uses GitHub Actions for CI/CD:

- **Infrastructure**: Manual trigger via GitHub Actions (per app)
- **Application**: Automatically deploys when pushing to `develop` or `main` branch

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

```
AWS_ACCESS_KEY_ID          # AWS access key with Cognito & SSM permissions
AWS_SECRET_ACCESS_KEY      # AWS secret key
AWS_REGION                 # AWS region (default: ap-southeast-2)
```

**Note**: User Pool IDs are no longer needed as secrets - they're stored in SSM Parameter Store and retrieved dynamically.

## API Usage Examples

**IMPORTANT**: All API requests must include the `X-App-ID` header to specify which app's User Pool to use.

### Registration
```bash
curl -X POST https://your-api-url/auth/register \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{
    "username": "johndoe",
    "password": "jd123123",
    "given_name": "John",
    "family_name": "Doe",
    "email": "john@example.com"
  }'
```

**Note**: `email` is optional. `family_name` must be at least 1 character.

### Login
```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{
    "username": "johndoe",
    "password": "jd123123"
  }'
```

**Note**: Users can only login to the app they registered with.

### Token Validation
```bash
curl -X POST https://your-api-url/token/validate \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{
    "token": "your-jwt-token"
  }'
```

### Get User Profile
```bash
curl -X GET https://your-api-url/user/profile \
  -H "Authorization: Bearer your-jwt-token" \
  -H "X-App-ID: kids-chat"
```

## Configuration

### Multi-App Architecture

Each app gets its own Cognito User Pool:
- **Infrastructure Stack**: `cognito-auth-infrastructure-{appName}-{stage}`
- **User Pool Name**: `auth-{appName}-{stage}-user-pool`
- **SSM Parameters**: `/auth-server/apps/{appName}/{stage}/user-pool-id`

### User Pool Settings

- Username-based authentication (not email)
- Password policy: Min 8 chars with lowercase + numbers
- Username: case-insensitive
- Account recovery: Admin-only
- Required attributes: `username`, `given_name`, `family_name`
- Optional attributes: `email`

### Environment Variables

Required Lambda environment variables:
- `REGION`: AWS region
- `STAGE`: Deployment stage (dev/prod)

**Note**: User Pool IDs are fetched from SSM Parameter Store at runtime based on `X-App-ID` header.

## Security Considerations

1. **Token Validation**: Implement proper JWT signature verification using Cognito's JWKS endpoint
2. **HTTPS Only**: Always use HTTPS in production
3. **CORS**: Configure CORS settings appropriately for your client applications
4. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints
5. **Environment Variables**: Never commit sensitive credentials to version control

## Integration with Client Applications

Your web applications can integrate with this authentication server by:

1. **Set X-App-ID Header**: Include `X-App-ID: your-app-name` in all API requests
2. **Registration**: Direct users to registration endpoint with app-specific header
3. **Login**: Authenticate users and receive JWT tokens
4. **Store Tokens**: Store JWT tokens securely (HttpOnly cookies recommended)
5. **Protected Requests**: Include `Authorization: Bearer <token>` and `X-App-ID` headers
6. **Token Refresh**: Implement token refresh logic before expiration

### Example: React Integration

```javascript
const APP_ID = 'kids-chat';
const API_URL = 'https://your-api-url';

// Register user
const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-ID': APP_ID,
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// Login user
const login = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-ID': APP_ID,
    },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};
```

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