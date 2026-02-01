# One Board API Documentation

## Overview

One Board provides a RESTful API for managing members, boards, posts, comments, files, and more. All API endpoints return JSON responses.

## Base URL

```
http://localhost:3000/api
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication

Most endpoints require authentication. Include your session token in HTTP-only cookies (automatically handled by the browser).

---

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new member account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "nickname": "Johnny",
  "name": "John Doe",
  "phone": "010-1234-5678"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "nickname": "Johnny"
  }
}
```

**Errors:**
- 400: Validation error (username/email already exists, weak password)
- 500: Server error

---

#### POST /api/auth/login
Login with username/email and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "nickname": "Johnny",
      "role": 1
    }
  }
}
```

**Errors:**
- 401: Invalid credentials
- 423: Account locked
- 500: Server error

---

#### POST /api/auth/logout
Logout the current user.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET /api/auth/me
Get current logged-in user information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "nickname": "Johnny",
    "name": "John Doe",
    "profileImage": "/uploads/profiles/...",
    "role": 1
  }
}
```

**Errors:**
- 401: Not authenticated

---

#### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

#### GET /api/auth/check-email?email=test@example.com
Check if email is already registered.

**Query Parameters:**
- `email` (string): Email to check

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

#### GET /api/auth/check-username?username=john_doe
Check if username is available.

**Query Parameters:**
- `username` (string): Username to check

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

#### GET /api/auth/check-nickname?nickname=Johnny
Check if nickname is available.

**Query Parameters:**
- `nickname` (string): Nickname to check

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

### Boards

#### GET /api/boards
Get list of all active boards.

**Query Parameters:**
- `category` (string, optional): Filter by category

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "공지사항",
      "description": "공지사항 게시판",
      "boardKey": "notice",
      "category": "공지",
      "icon": "/icons/notice.png",
      "postCount": 10,
      "readPermission": 0,
      "writePermission": 2,
      "allowFileUpload": true,
      "displayOrder": 1
    }
  ]
}
```

---

#### POST /api/boards
Create a new board (Admin only).

**Request Body:**
```json
{
  "name": "새 게시판",
  "description": "새로운 게시판",
  "boardKey": "new-board",
  "category": "자유",
  "readPermission": 0,
  "writePermission": 1,
  "commentPermission": 1,
  "allowFileUpload": true,
  "maxFileCount": 5,
  "maxFileSize": 5242880,
  "displayOrder": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "새 게시판",
    "boardKey": "new-board"
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not authorized (admin only)

---

#### PUT /api/boards/[id]
Update a board (Admin only).

**Request Body:** Same as POST /api/boards

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "수정된 게시판"
  }
}
```

---

#### DELETE /api/boards/[id]
Delete a board (Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Board deleted successfully"
}
```

---

### Posts

#### GET /api/posts
Get list of posts with filtering and pagination.

**Query Parameters:**
- `boardId` (number): Board ID
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Posts per page
- `sort` (string, default: latest): Sort option (latest, popular, mostViewed, mostCommented)
- `search` (string): Search keyword
- `category` (string): Filter by category

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "게시글 제목",
        "content": "게시글 내용...",
        "author": {
          "id": 1,
          "username": "john_doe",
          "nickname": "Johnny"
        },
        "boardId": 1,
        "category": "일반",
        "viewCount": 100,
        "likeCount": 5,
        "commentCount": 3,
        "isNotice": false,
        "isPinned": false,
        "createdAt": "2026-01-22T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

#### GET /api/posts/[id]
Get a single post by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "게시글 제목",
    "content": "게시글 내용...",
    "author": {
      "id": 1,
      "username": "john_doe",
      "nickname": "Johnny"
    },
    "boardId": 1,
    "category": "일반",
    "tags": "태그1,태그2",
    "viewCount": 100,
    "likeCount": 5,
    "commentCount": 3,
    "isNotice": false,
    "isPinned": false,
    "createdAt": "2026-01-22T10:00:00Z",
    "updatedAt": "2026-01-22T10:00:00Z"
  }
}
```

**Errors:**
- 404: Post not found

---

#### POST /api/posts
Create a new post (Member only).

**Request Body:**
```json
{
  "boardId": 1,
  "title": "새 게시글",
  "content": "<p>게시글 내용</p>",
  "category": "일반",
  "tags": "태그1,태그2",
  "isNotice": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "새 게시글"
  }
}
```

**Errors:**
- 401: Not authenticated
- 400: Validation error

---

#### PUT /api/posts/[id]
Update a post (Author or Admin only).

**Request Body:** Same as POST /api/posts

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "수정된 제목"
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not authorized
- 404: Post not found

---

#### DELETE /api/posts/[id]
Delete a post (Author or Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

#### POST /api/posts/[id]/like
Like/unlike a post (Member only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 6
  }
}
```

---

#### GET /api/posts/popular
Get popular posts.

**Query Parameters:**
- `limit` (number, default: 10): Number of posts
- `period` (string, default: week): Time period (day, week, month)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "인기 게시글",
      "viewCount": 1000,
      "likeCount": 50,
      "commentCount": 20
    }
  ]
}
```

---

### Comments

#### GET /api/comments
Get comments for a post.

**Query Parameters:**
- `postId` (number): Post ID
- `parentId` (number, optional): Parent comment ID (for replies)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "댓글 내용",
      "author": {
        "id": 1,
        "username": "john_doe",
        "nickname": "Johnny"
      },
      "postId": 1,
      "parentId": null,
      "likeCount": 2,
      "createdAt": "2026-01-22T10:00:00Z",
      "replies": []
    }
  ]
}
```

---

#### POST /api/comments
Create a new comment (Member only).

**Request Body:**
```json
{
  "postId": 1,
  "content": "새 댓글",
  "parentId": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "content": "새 댓글"
  }
}
```

---

#### PUT /api/comments/[id]
Update a comment (Author or Admin only).

**Request Body:**
```json
{
  "content": "수정된 댓글"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "수정된 댓글"
  }
}
```

---

#### DELETE /api/comments/[id]
Delete a comment (Author or Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### File Upload

#### POST /api/upload
Upload a file (image or general file).

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (File)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "/uploads/images/2026/01/22/abc123.jpg",
    "originalName": "photo.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080
  }
}
```

**Errors:**
- 400: Invalid file type or size
- 401: Not authenticated

---

### Members (Admin)

#### GET /api/members
Get list of members (Admin only).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Members per page
- `search` (string): Search keyword
- `status` (number): Filter by status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "nickname": "Johnny",
        "role": 1,
        "status": 1,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

---

#### PUT /api/members/[id]
Update a member (Admin only).

**Request Body:**
```json
{
  "role": 2,
  "status": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "role": 2
  }
}
```

---

#### DELETE /api/members/[id]
Delete/suspend a member (Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Member deleted successfully"
}
```

---

### Skins (Admin)

#### GET /api/skins
Get list of skins.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Basic Skin",
      "skinKey": "basic",
      "description": "기본 스킨",
      "version": "1.0.0",
      "author": "One Board",
      "isSystem": true,
      "isActive": true
    }
  ]
}
```

---

#### POST /api/skins
Create a new skin (Admin only).

**Request Body:**
```json
{
  "name": "New Skin",
  "skinKey": "new-skin",
  "description": "새 스킨",
  "version": "1.0.0",
  "author": "Author",
  "config": {}
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "skinKey": "new-skin"
  }
}
```

---

### System Config (Admin)

#### GET /api/config
Get system configuration.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "key": "site_name",
      "value": "One Board",
      "type": "string"
    }
  ]
}
```

---

#### PUT /api/config/[key]
Update a config value (Admin only).

**Request Body:**
```json
{
  "value": "New Value"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "key": "site_name",
    "value": "New Value"
  }
}
```

---

### Notifications

#### GET /api/notifications
Get notifications for current user.

**Query Parameters:**
- `unreadOnly` (boolean): Get only unread notifications

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "comment",
      "title": "새 댓글",
      "message": "게시글에 새 댓글이 달렸습니다.",
      "link": "/board/free/1",
      "isRead": false,
      "createdAt": "2026-01-22T10:00:00Z"
    }
  ]
}
```

---

#### PUT /api/notifications/[id]/read
Mark notification as read.

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Statistics

#### GET /api/stats/members
Get member statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 95,
    "suspended": 5,
    "newThisMonth": 10
  }
}
```

---

#### GET /api/stats/boards
Get board statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "active": 8,
    "totalPosts": 500
  }
}
```

---

#### GET /api/stats/posts
Get post statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "today": 5,
    "thisWeek": 25,
    "thisMonth": 100
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | No permission |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input |
| `DUPLICATE` | Duplicate entry |
| `ACCOUNT_LOCKED` | Account is locked |
| `INVALID_CREDENTIALS` | Wrong username/password |

---

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP
- 1000 requests per hour per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642857600
```

---

## Versioning

Current API version: **v1**

Include version in URL for future compatibility:
```
/api/v1/...
```
