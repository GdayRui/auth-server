# IAM Policies

This directory contains IAM policies required for deploying and managing the auth server.

## auth-server-deploy-policy.json

This policy should be attached to the IAM user used by GitHub Actions for automated deployments.

### Required Permissions:

- **Cognito**: Full access to manage User Pools and Clients
- **CloudFormation**: Full access to create/update/delete stacks
- **S3**: Access to deployment buckets
- **Lambda**: Full access to manage Lambda functions
- **API Gateway**: Full access to manage REST APIs
- **IAM**: Limited access to create/manage service roles for Lambda
- **CloudWatch Logs**: Full access for Lambda logging
- **SSM Parameter Store**: Access to create/read/delete parameters under `/auth-server/*`

### How to Apply

**Via AWS Console:**
1. Go to IAM → Users → `auth-server-deploy`
2. Click "Add permissions" → "Create inline policy"
3. Switch to JSON tab
4. Paste the contents of `auth-server-deploy-policy.json`
5. Name it: `AuthServerDeploymentPolicy`
6. Click "Create policy"

**Via AWS CLI:**
```bash
aws iam put-user-policy \
  --user-name auth-server-deploy \
  --policy-name AuthServerDeploymentPolicy \
  --policy-document file://iam-policies/auth-server-deploy-policy.json
```

### Security Notes

- The SSM resource ARN includes the AWS account ID: `022660491036`
- Update the account ID if deploying to a different AWS account
- Permissions are scoped to specific resources where possible
- Consider using managed policies or AWS Organizations SCPs for additional guardrails

### GitHub Secrets Required

The IAM user credentials should be stored as GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (default: `ap-southeast-2`)
