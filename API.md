# Auth Server API Documentation

Base URL: `https://your-api-gateway-url/dev`

**IMPORTANT**: All requests must include the `X-App-ID` header to specify which application's User Pool to use.

## Table of Contents
- [Authentication](#authentication)
- [Token Management](#token-management)
- [User Management](#user-management)
- [Error Responses](#error-responses)

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
X-App-ID: kids-chat
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "test1234",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john@example.com"
}
```

**Fields:**
- `username` (required): Unique username, case-insensitive, immutable
- `password` (required): Minimum 8 characters with lowercase and numbers
- `given_name` (required): User's first name
- `family_name` (required): User's last name, minimum 1 character
- `email` (optional): User's email address, must be unique if provided

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "data": {
    "username": "johndoe"
  }
}
```

**Error Responses:**
- `400` - Invalid input or password requirements not met
- `409` - Username already exists

---

### Login

Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
X-App-ID: kids-chat
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "test1234"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "data": {
    "accessToken": "eyJraWQiOiJ...",
    "idToken": "eyJraWQiOiJ...",
    "refreshToken": "eyJjdHkiOiJ...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Token Details:**
- `accessToken`: Used for API authorization (expires in 60 minutes)
- `idToken`: Contains user identity information (expires in 60 minutes)
- `refreshToken`: Used to obtain new access tokens (expires in 30 days)
- `expiresIn`: Token expiration time in seconds
- `tokenType`: Always "Bearer"

**Error Responses:**
- `401` - Invalid credentials
- `404` - User not found

---

### Refresh Token

Obtain new access and ID tokens using a refresh token.

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Content-Type: application/json
X-App-ID: kids-chat
```

**Request Body:**
```json
{
  "refreshToken": "eyJjdHkiOiJ..."
}
```

**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJraWQiOiJ...",
    "idToken": "eyJraWQiOiJ...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Note:** Refresh token is not returned; use the original refresh token for future refreshes.

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### Logout

Logout a user (client-side token cleanup).

**Endpoint:** `POST /auth/logout`

**Headers:**
```
X-App-ID: kids-chat
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Note:** This endpoint primarily serves as a confirmation. The client should discard all tokens after logout.

---

## Token Management

### Validate Token

Validate and decode a JWT token.

**Endpoint:** `POST /token/validate`

**Headers:**
```
Content-Type: application/json
X-App-ID: kids-chat
```

**Request Body:**
```json
{
  "token": "eyJraWQiOiJ..."
}
```

**Success Response (200):**
```json
{
  "message": "Token is valid",
  "data": {
    "sub": "99ceb4a8-f0b1-7009-7914-852612801b88",
    "email": "john@example.com",
    "tokenType": "access",
    "expiresAt": 1765629271,
    "issuedAt": 1765625671
  }
}
```

**Error Responses:**
- `400` - Token is required
- `401` - Invalid token format or token expired

**Note:** This performs basic validation. For production use, implement full JWT signature verification using Cognito JWKS.

---

## User Management

### Get User Profile

Retrieve the authenticated user's profile information.

**Endpoint:** `GET /user/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
X-App-ID: kids-chat
```

**Success Response (200):**
```json
{
  "message": "User retrieved successfully",
  "data": {
    "username": "johndoe",
    "email": "john@example.com",
    "given_name": "John",
    "family_name": "Doe",
    "emailVerified": false,
    "enabled": true,
    "userStatus": "CONFIRMED",
    "createdDate": "2025-12-13T10:30:00.000Z",
    "lastModifiedDate": "2025-12-13T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Invalid or missing authorization token
- `404` - User not found

---

### Update User Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /user/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
X-App-ID: kids-chat
```

**Request Body:**
```json
{
  "given_name": "Jonathan",
  "family_name": "Doe",
  "email": "jonathan.doe@example.com"
}
```

**Fields:**
- `given_name` (optional): User's first name, minimum 1 character
- `family_name` (optional): User's last name, minimum 1 character
- `email` (optional): User's email address

**Note:** All fields are optional. Only provide the fields you want to update.

**Success Response (200):**
```json
{
  "message": "User updated successfully"
}
```

**Error Responses:**
- `400` - Invalid input or no fields provided
- `401` - Invalid or missing authorization token
- `404` - User not found

---

### Delete User Account

Delete the authenticated user's account permanently.

**Endpoint:** `DELETE /user/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
X-App-ID: kids-chat
```

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401` - Invalid or missing authorization token
- `404` - User not found

**Warning:** This operation is irreversible. All user data will be permanently deleted.

---

### Change Password

Change the authenticated user's password.

**Endpoint:** `POST /user/change-password`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
X-App-ID: kids-chat
```

**Request Body:**
```json
{
  "oldPassword": "test1234",
  "newPassword": "newpass1234"
}
```

**Fields:**
- `oldPassword` (required): Current password (not verified in current implementation)
- `newPassword` (required): New password, minimum 8 characters with lowercase and numbers

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Invalid password format
- `401` - Invalid or missing authorization token
- `404` - User not found

**Note:** Current implementation directly sets the new password without verifying the old password. Consider adding old password verification in production.

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_REQUEST | Missing required fields or invalid input |
| 400 | INVALID_PASSWORD | Password doesn't meet requirements |
| 401 | INVALID_CREDENTIALS | Incorrect username or password |
| 401 | INVALID_TOKEN | Token is invalid or expired |
| 401 | UNAUTHORIZED | Missing or invalid authorization header |
| 404 | USER_NOT_FOUND | User does not exist |
| 409 | USER_EXISTS | Username already taken |
| 500 | INTERNAL_ERROR | Server error |

---

## Authentication Flow

### Registration and Login Flow

```
1. Register User
   POST /auth/register
   └─> Returns success confirmation

2. Login
   POST /auth/login
   └─> Returns accessToken, idToken, refreshToken

3. Use Access Token
   Include in Authorization header: "Bearer <accessToken>"
   └─> Make authenticated requests (GET /user/profile, etc.)

4. Token Expires
   When accessToken expires (~60 min)
   └─> Use refreshToken to get new tokens

5. Refresh Token
   POST /auth/refresh
   └─> Returns new accessToken and idToken

6. Logout
   POST /auth/logout
   └─> Discard all tokens on client side
```

### Token Usage

**For Protected Endpoints:**
```bash
curl -X GET https://your-api-url/dev/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-App-ID: kids-chat"
```

**Token Lifecycle:**
- Access Token: 60 minutes
- ID Token: 60 minutes  
- Refresh Token: 30 days

---

## Multi-App Architecture

This auth server supports multiple isolated applications using the `X-App-ID` header.

**Key Points:**
- Each app has its own Cognito User Pool
- Users registered in one app cannot login to another app
- The `X-App-ID` header is **required** for all requests
- Usernames are unique per app (not globally)

**Example:**
```bash
# Register user in kids-chat app
curl -X POST https://your-api-url/dev/auth/register \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{"username": "john", "password": "pass1234", ...}'

# Same username can exist in todo-app
curl -X POST https://your-api-url/dev/auth/register \
  -H "Content-Type: application/json" \
  -H "X-App-ID: todo-app" \
  -d '{"username": "john", "password": "pass1234", ...}'
```

---

## Example Usage

### Complete Registration and Profile Update Flow

```bash
# 1. Register a new user
curl -X POST https://your-api-url/dev/auth/register \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{
    "username": "alice",
    "password": "alice1234",
    "given_name": "Alice",
    "family_name": "Smith",
    "email": "alice@example.com"
  }'

# 2. Login to get tokens
curl -X POST https://your-api-url/dev/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-ID: kids-chat" \
  -d '{
    "username": "alice",
    "password": "alice1234"
  }'

# Response: Save the accessToken
# {
#   "data": {
#     "accessToken": "eyJraWQi...",
#     "refreshToken": "eyJjdHki..."
#   }
# }

# 3. Get user profile
curl -X GET https://your-api-url/dev/user/profile \
  -H "Authorization: Bearer eyJraWQi..." \
  -H "X-App-ID: kids-chat"

# 4. Update profile
curl -X PUT https://your-api-url/dev/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJraWQi..." \
  -H "X-App-ID: kids-chat" \
  -d '{
    "email": "alice.smith@example.com"
  }'

# 5. Change password
curl -X POST https://your-api-url/dev/user/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJraWQi..." \
  -H "X-App-ID: kids-chat" \
  -d '{
    "oldPassword": "alice1234",
    "newPassword": "newalice1234"
  }'
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting in production using:
- AWS WAF
- API Gateway Usage Plans
- Custom Lambda authorizers

---

## CORS

CORS is enabled for all endpoints with:
- Origin: `*` (all origins allowed)
- Headers: `Content-Type`, `Authorization`, `X-App-ID`
- Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

For production, restrict origins to your specific domains.

---

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Storage**: Store tokens securely (HttpOnly cookies recommended)
3. **Token Expiration**: Implement automatic token refresh before expiration
4. **Password Policy**: Current policy requires 8+ chars with lowercase and numbers
5. **JWT Verification**: Implement proper JWT signature verification using Cognito JWKS endpoint
6. **Rate Limiting**: Add rate limiting to prevent abuse
7. **Input Validation**: All inputs are validated, but additional sanitization may be needed
8. **Audit Logging**: Consider adding audit logs for sensitive operations

---

## Support

For issues or questions, refer to the deployment documentation in `DEPLOYMENT.md` or check the GitHub repository.
