# Deployment Guide

## Overview

This project uses a **two-stack deployment** architecture:
1. **Infrastructure Stack** - Cognito User Pool (deployed separately, rarely changes)
2. **Application Stack** - Lambda functions and API Gateway (deployed frequently)

## Initial Setup

### Step 1: Deploy Infrastructure (Per App)

**IMPORTANT**: Deploy infrastructure once for each application that will use this auth server.

**Via GitHub Actions:**
1. Go to GitHub → Actions → "Deploy Infrastructure"
2. Click "Run workflow"
3. Select environment: `dev` or `prod`
4. Enter app name (e.g., `kids-chat`)
5. Select action: `deploy`
6. Click "Run workflow"

**Via Command Line:**
```bash
serverless deploy --config serverless-infrastructure.yml --stage dev --param="appName=kids-chat"
```

This creates:
- A dedicated Cognito User Pool for the app: `auth-{appName}-{stage}-user-pool`
- SSM Parameters:
  - `/auth-server/apps/{appName}/{stage}/user-pool-id`
  - `/auth-server/apps/{appName}/{stage}/user-pool-client-id`

User Pool configuration:
- Username-based authentication (not email)
- Required attributes: `username`, `given_name`, `family_name`, `password`
- Optional attributes: `email`
- Password policy: Minimum 8 characters with lowercase and numbers
- Password recovery: Admin-only
- Username: case-insensitive

### Step 2: Deploy Application

After infrastructure is deployed, deploy the application:

**Option A: Automatic (Push to branch)**
```bash
git push origin main        # Deploys to production
git push origin develop     # Deploys to development
```

**Option B: Manual trigger**
1. Go to GitHub → Actions → "Deploy Auth Application"
2. Click "Run workflow"
3. Select environment: `dev` or `prod`

## Using the API

**CRITICAL**: All API requests must include the `X-App-ID` header to identify which User Pool to use.

### User Registration

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

Required fields:
- `username` (unique per app, immutable)
- `password` (8+ chars with lowercase and numbers)
- `given_name`
- `family_name` (minimum 1 character)
- `email` (optional, but unique if provided)

### User Login

```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{
    "username": "johndoe",
    "password": "jd123123"
  }'
```

**Note**: Users can only login to the app they registered with. Cross-app authentication is not supported.

## Important Notes

### ⚠️ Infrastructure Changes
- **DO NOT** modify `serverless-infrastructure.yml` in production without careful planning
- Changing User Pool configuration may require data migration
- Always test infrastructure changes in `dev` environment first

### 🔄 Update Existing Deployment

If you need to update infrastructure:
1. Test in dev: Deploy infrastructure to `dev` environment
2. Update application: Deploy application to use new infrastructure
3. Verify: Test all endpoints
4. Production: Repeat for `prod` environment

### 🗑️ Removing Infrastructure

To remove the infrastructure stack (⚠️ DELETES ALL USERS):
1. Go to GitHub → Actions → "Deploy Infrastructure"
2. Select action: `remove`
3. This will delete the Cognito User Pool and all user data

## Multi-App Architecture

```
Infrastructure Stack (cognito-auth-infrastructure-{appName}-{stage})
  └── Creates:
      ├── User Pool: auth-{appName}-{stage}-user-pool
      └── SSM Parameters:
          ├── /auth-server/apps/{appName}/{stage}/user-pool-id
          └── /auth-server/apps/{appName}/{stage}/user-pool-client-id
          ↓
Application Stack (cognito-auth-server-{stage})
  └── Lambda functions read app config from SSM at runtime
  └── Routes requests based on X-App-ID header
  └── One application stack serves all apps
```

### Example: Multiple Apps

```bash
# Deploy infrastructure for kids-chat app
serverless deploy --config serverless-infrastructure.yml --stage dev --param="appName=kids-chat"

# Deploy infrastructure for todo-app
serverless deploy --config serverless-infrastructure.yml --stage dev --param="appName=todo-app"

# Deploy application once (serves both apps)
serverless deploy --stage dev
```

Now users in `kids-chat` are completely isolated from users in `todo-app`.

## Troubleshooting

### Missing X-App-ID header
Error: `X-App-ID header is required`
- Ensure all API requests include the `X-App-ID` header

### Invalid or unregistered app
Error: `App 'xyz' is not registered or does not exist in stage 'dev'`
- The app has not been deployed via infrastructure stack
- Deploy infrastructure with `--param="appName=xyz"`
- Verify SSM parameter exists: `/auth-server/apps/xyz/dev/user-pool-id`

### User Pool already exists
If you get conflicts during infrastructure deployment:
- Check AWS CloudFormation console for existing stacks
- Stack name format: `cognito-auth-infrastructure-{appName}-{stage}`

### Authentication issues
- Verify User Pool ID in SSM Parameter Store
- Check CloudWatch logs for Lambda errors
- Ensure app name in X-App-ID matches deployed infrastructure