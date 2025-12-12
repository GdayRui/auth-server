# Deployment Guide

## Overview

This project uses a **two-stack deployment** architecture:
1. **Infrastructure Stack** - Cognito User Pool (deployed separately, rarely changes)
2. **Application Stack** - Lambda functions and API Gateway (deployed frequently)

## Initial Setup

### Step 1: Deploy Infrastructure (One-Time)

1. Go to GitHub → Actions → "Deploy Infrastructure"
2. Click "Run workflow"
3. Select environment: `dev` or `prod`
4. Select action: `deploy`
5. Click "Run workflow"

This creates the Cognito User Pool with the following configuration:
- Username-based authentication (not email)
- Required attributes: `username`, `given_name`, `family_name`, `password`
- Optional attributes: `email`, `preferred_name`
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

## User Registration

New user registration requires:
- `username` (required, unique, immutable)
- `password` (required, 8+ chars with uppercase, lowercase, number, symbol)
- `given_name` (required)
- `family_name` (required, minimum 1 character)
- `preferred_name` (optional)
- `email` (optional, but unique if provided)

Example:
```json
{
  "username": "johndoe",
  "password": "SecurePass123!",
  "given_name": "John",
  "family_name": "D",
  "preferred_name": "Johnny",
  "email": "john@example.com"
}
```

## User Login

Login with username and password:
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

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

## Stack Dependencies

```
Infrastructure Stack (cognito-auth-infrastructure-{stage})
  └── Exports:
      ├── user-pool-id
      └── user-pool-client-id
          ↓
Application Stack (cognito-auth-server-{stage})
  └── Imports infrastructure exports
  └── Creates Lambda functions and API Gateway
```

## Troubleshooting

### "Export not found" error
The application stack cannot find the infrastructure exports. Ensure:
1. Infrastructure stack is deployed first
2. Stage names match (dev/prod)
3. Stack names are correct in `serverless.yml`

### User Pool already exists
If you get conflicts, check AWS CloudFormation console for existing stacks.

### Authentication issues
- Verify User Pool ID and Client ID in CloudFormation outputs
- Check Lambda environment variables match infrastructure exports