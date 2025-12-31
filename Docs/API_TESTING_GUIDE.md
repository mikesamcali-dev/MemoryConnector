# Memory Connector - API Testing Guide

> **Swagger UI**: http://localhost:4000/api/v1/docs

---

## 🚀 Quick Start

### 1. Start the Services

```powershell
# Terminal 1: Start backend
cd apps\api
pnpm dev

# Terminal 2: Start frontend (optional, for full testing)
cd apps\web
pnpm dev
```

### 2. Access Swagger UI

Open your browser and navigate to:
```
http://localhost:4000/api/v1/docs
```

---

## 🔐 Authentication Flow

### Step 1: Register a New User

**Endpoint:** `POST /api/v1/auth/signup`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "tier": "free"
  }
}
```

### Step 2: Login (Alternative)

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:** Same as signup

### Step 3: Use the Access Token

Copy the `accessToken` from the response and use it in subsequent requests:

**Header:**
```
Authorization: Bearer <accessToken>
```

**In Swagger UI:**
1. Click the "Authorize" button (top right)
2. Enter: `Bearer <your-token>`
3. Click "Authorize"
4. All requests will now include the token

---

## 📝 Testing Core Endpoints

### Create a Memory

**Endpoint:** `POST /api/v1/memories`

**Headers:**
```
Authorization: Bearer <token>
Idempotency-Key: <unique-key>  # Optional but recommended
Content-Type: application/json
```

**Request:**
```json
{
  "textContent": "Had a great meeting with the team today. Discussed the new product features.",
  "imageUrl": null,
  "type": "note"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "textContent": "Had a great meeting...",
  "type": "note",
  "state": "SAVED",
  "enrichmentStatus": "pending",
  "createdAt": "2024-12-22T10:00:00Z",
  "enrichmentQueued": false
}
```

**Test Scenarios:**
- ✅ Create with text only
- ✅ Create with image URL
- ✅ Test duplicate detection (send same content twice)
- ✅ Test idempotency (send same request with same Idempotency-Key)
- ✅ Test tier limits (create 11 memories as free user)

---

### Search Memories

**Endpoint:** `GET /api/v1/search?q=<query>`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /api/v1/search?q=meeting with team&limit=10
```

**Response:**
```json
{
  "memories": [
    {
      "id": "uuid",
      "textContent": "Had a great meeting...",
      "type": "note",
      "relevanceScore": 0.95
    }
  ],
  "method": "semantic",
  "degraded": false,
  "query": "meeting with team",
  "totalCount": 1
}
```

**Test Scenarios:**
- ✅ Semantic search (should work if OpenAI configured)
- ✅ Keyword fallback (if semantic fails, should use FTS)
- ✅ Empty results
- ✅ Pagination
- ✅ Tier limits (free: 50 searches/day)

---

### Get All Memories

**Endpoint:** `GET /api/v1/memories`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (optional): Number to skip (default: 0)
- `take` (optional): Number to return (default: 20)

**Example:**
```
GET /api/v1/memories?skip=0&take=20
```

**Response:**
```json
[
  {
    "id": "uuid",
    "textContent": "Memory text...",
    "type": "note",
    "state": "SAVED",
    "createdAt": "2024-12-22T10:00:00Z"
  }
]
```

---

### Get Single Memory

**Endpoint:** `GET /api/v1/memories/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "textContent": "Memory text...",
  "type": "note",
  "state": "SAVED",
  "createdAt": "2024-12-22T10:00:00Z",
  "updatedAt": "2024-12-22T10:00:00Z"
}
```

---

### Reminder Inbox

**Endpoint:** `GET /api/v1/reminders/inbox`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "unreadCount": 3,
  "reminders": [
    {
      "reminderId": "uuid",
      "memoryId": "uuid",
      "memoryPreview": "Had a great meeting...",
      "memoryType": "note",
      "hasImage": false,
      "scheduledAt": "2024-12-22T10:00:00Z",
      "sentAt": "2024-12-22T10:00:00Z",
      "readAt": null
    }
  ]
}
```

---

### Mark Reminder as Read

**Endpoint:** `POST /api/v1/reminders/{id}/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### Dismiss Reminder

**Endpoint:** `POST /api/v1/reminders/{id}/dismiss`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

## 🧪 Testing Advanced Features

### Test Idempotency

1. Create a memory with an `Idempotency-Key` header
2. Send the exact same request again with the same key
3. Should return the same response (cached)
4. Check response header: `X-Idempotency-Replayed: true`

### Test Duplicate Detection

1. Create a memory with text: "Test duplicate"
2. Immediately create another memory with the same text
3. Should receive `409 Conflict` with error: `DUPLICATE_CONTENT`

### Test Tier Limits

**As Free User:**
1. Create 10 memories (should succeed)
2. Try to create 11th memory (should fail with `429 Too Many Requests`)
3. Check response for upgrade URL

**As Premium User:**
1. Create 100+ memories (should all succeed)

### Test Search Fallback

1. Disable OpenAI API key (or use invalid key)
2. Perform a search
3. Should fallback to keyword search
4. Response should have `"degraded": true` and `"method": "keyword"`

### Test Offline Queue (Frontend)

1. Open browser DevTools → Network tab
2. Set to "Offline" mode
3. Create a memory in the UI
4. Should show "Saved offline" toast
5. Go back online
6. Memory should sync automatically

---

## 🔍 Using Swagger UI

### Step-by-Step Testing

1. **Open Swagger UI**
   ```
   http://localhost:4000/api/v1/docs
   ```

2. **Authorize**
   - Click "Authorize" button (🔒 icon)
   - Enter: `Bearer <your-access-token>`
   - Click "Authorize"
   - Click "Close"

3. **Test Endpoints**
   - Expand any endpoint section
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"
   - View response

4. **Response Codes**
   - `200 OK`: Success
   - `201 Created`: Resource created
   - `400 Bad Request`: Invalid input
   - `401 Unauthorized`: Missing/invalid token
   - `409 Conflict`: Duplicate content
   - `429 Too Many Requests`: Rate limit exceeded

---

## 📊 Testing with cURL

### Register User
```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Memory
```bash
curl -X POST http://localhost:4000/api/v1/memories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-123" \
  -d '{"textContent":"Test memory","type":"note"}'
```

### Search
```bash
curl -X GET "http://localhost:4000/api/v1/search?q=test" \
  -H "Authorization: Bearer <token>"
```

---

## 🐛 Common Issues

### 401 Unauthorized
- **Cause**: Missing or expired token
- **Fix**: Re-authenticate and get new token

### 429 Too Many Requests
- **Cause**: Rate limit exceeded
- **Fix**: Wait or upgrade tier

### 500 Internal Server Error
- **Cause**: Server error (check logs)
- **Fix**: Check backend logs in terminal

### Connection Refused
- **Cause**: Backend not running
- **Fix**: Start backend with `pnpm dev` in `apps/api`

---

## 📝 Test Checklist

### Authentication ✅
- [ ] Register new user
- [ ] Login with credentials
- [ ] Use access token in requests
- [ ] Test token expiration

### Memories ✅
- [ ] Create memory (text only)
- [ ] Create memory (with image)
- [ ] Get all memories
- [ ] Get single memory
- [ ] Test duplicate detection
- [ ] Test idempotency

### Search ✅
- [ ] Semantic search
- [ ] Keyword fallback
- [ ] Pagination
- [ ] Empty results

### Limits ✅
- [ ] Free tier limits (10/day)
- [ ] Premium tier limits (100/day)
- [ ] Search limits (50/day free)

### Reminders ✅
- [ ] Get inbox
- [ ] Mark as read
- [ ] Dismiss reminder

---

## 🔗 Quick Links

- **Swagger UI**: http://localhost:4000/api/v1/docs
- **Health Check**: http://localhost:4000/api/v1/health
- **Frontend**: http://localhost:5173

---

**Happy Testing!** 🚀



