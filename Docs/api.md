# Memory Connector API Reference

## Base URL

```
http://localhost:4000/api/v1
```

## Authentication

All endpoints (except auth) require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Refresh tokens are stored in httpOnly cookies and automatically sent with refresh requests.

## Endpoints

### Auth

#### POST /auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "tier": "free",
    "roles": ["user"]
  }
}
```

#### POST /auth/login
Login with email and password.

**Request:** Same as signup

**Response:** Same as signup

#### POST /auth/refresh
Refresh access token using refresh cookie.

**Response:**
```json
{
  "accessToken": "eyJ..."
}
```

#### POST /auth/logout
Logout and revoke refresh token.

#### GET /auth/me
Get current user information.

### Memories

#### POST /memories
Create a new memory.

**Headers:**
- `Idempotency-Key`: Required for idempotency

**Request:**
```json
{
  "textContent": "Remember to call mom",
  "imageUrl": "https://..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "textContent": "Remember to call mom",
  "state": "SAVED",
  "enrichmentQueued": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET /memories
List user memories.

**Query Parameters:**
- `skip`: Pagination offset (default: 0)
- `take`: Page size (default: 20)

#### GET /memories/:id
Get a specific memory.

### Search

#### GET /search?q=query
Search memories.

**Query Parameters:**
- `q`: Search query (required)
- `limit`: Max results (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "memories": [...],
  "method": "semantic" | "keyword",
  "degraded": false,
  "query": "query",
  "totalCount": 10
}
```

### Reminders

#### GET /reminders/inbox
Get reminder inbox.

**Response:**
```json
{
  "unreadCount": 5,
  "reminders": [...]
}
```

#### POST /reminders/:id/read
Mark reminder as read.

#### POST /reminders/:id/dismiss
Dismiss reminder from inbox.

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid or missing token
- `LIMIT_EXCEEDED`: Usage limit reached (429)
- `DUPLICATE_CONTENT`: Content already saved (409)
- `IDEMPOTENCY_KEY_REUSED`: Key used with different request (422)
- `DUPLICATE_REQUEST`: Concurrent request with same key (409)

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:4000/api/v1/docs
```

