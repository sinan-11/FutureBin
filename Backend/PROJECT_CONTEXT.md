# Future Bin Backend — Project Overview

## Tech Stack
- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose 9
- **Auth:** jsonwebtoken + bcryptjs
- **Security:** express-rate-limit, cors
- **Dev:** nodemon

## Folder Structure

```
Backend/
├── Server.js                    # Entry point, middleware, routes, 404 handler
├── .env                         # PORT, MONGO_URL, JWT secrets
├── package.json
└── src/
    ├── config/
    │   └── db.js                # MongoDB connection
    ├── models/
    │   └── User.js              # User schema (all roles)
    ├── controllers/
    │   ├── authController.js    # register, login, refresh, logout handlers
    │   └── userController.js    # getMe, getUser, getUsers, approve, availability, location
    ├── services/
    │   └── userService.js       # All business logic (register, login, tokens, CRUD)
    ├── middlewares/
    │   └── auth.js              # protect (JWT verify) + authorize (role check)
    ├── routes/
    │   ├── authRoutes.js        # POST /register, /login, /refresh, /logout
    │   └── userRoutes.js        # GET /me, PATCH /availability, /location, Admin CRUD
    └── utils/
        └── generateToken.js     # generateAccessToken (15m), generateRefreshToken (7d)
```

## User Roles

| Role       | Can register | Needs approval | Can login after approval |
|------------|-------------|----------------|--------------------------|
| resident   | ✅ Yes      | ❌ No          | ✅ Immediately           |
| collector  | ✅ Yes      | ✅ Yes (admin) | ✅ After admin approves  |
| admin      | ❌ No       | N/A            | ✅ (seeded manually)     |

## Auth Flow

1. **Register** → password hashed with bcrypt (10 rounds) → resident gets access + refresh tokens immediately → collector gets `{ message: "Await admin approval" }` with no tokens
2. **Login** → checks email exists → compares password → checks collector approval → issues access token (15m) + refresh token (7d)
3. **Refresh** → verifies refresh token JWT → compares against stored token in DB → rotates: issues new pair, invalidates old one
4. **Logout** → verifies refresh token → sets stored token to `null`

## Authorization (Route Protection)

All protected routes use two middlewares in chain:
- `protect` — extracts Bearer token, verifies with `JWT_ACCESS_SECRET`, attaches `{ id, role }` to `req.user`
- `authorize("role1", "role2")` — checks `req.user.role` is in allowed list, returns 403 if not

| Endpoint                     | Method | protect | authorize       | Controller               |
|------------------------------|--------|---------|-----------------|--------------------------|
| /api/auth/register           | POST   | ❌      | ❌              | register                 |
| /api/auth/login              | POST   | ❌      | ❌              | login                    |
| /api/auth/refresh            | POST   | ❌      | ❌              | refresh                  |
| /api/auth/logout             | POST   | ❌      | ❌              | logout                   |
| /api/users/me                | GET    | ✅      | ❌              | getMe                    |
| /api/users/availability      | PATCH  | ✅      | collector       | setAvailability          |
| /api/users/location          | PATCH  | ✅      | collector       | setLocation              |
| /api/users                   | GET    | ✅      | admin           | getUsers                 |
| /api/users/:id               | GET    | ✅      | admin           | getUser                  |
| /api/users/:id/approve       | PATCH  | ✅      | admin           | approveCollectorHandler  |

## User Schema Fields

- `name` (required, trimmed)
- `email` (required, unique, lowercase, trimmed)
- `password` (required, minlength 6, hashed with bcrypt)
- `role` (enum: resident | collector | admin, default: resident)
- `isApproved` (default: true for resident, false for collector)
- `isAvailable` (default: false, for collectors)
- `location` (GeoJSON Point with 2dsphere sparse index)
- `collectorDetails` (embedded: phone, vehicleNumber, idProof, vehiclePhoto)
- `refreshToken` (stored with `select: false`, invisible by default)
- `timestamps` (createdAt, updatedAt auto-managed)

## Key Security Measures Already In Place

- Passwords hashed with bcrypt (10 salt rounds)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days, stored in DB, rotated on each use
- Refresh token has `select: false` — never returned in normal queries
- Password stripped from all API responses
- Generic login error ("Invalid email or password" — doesn't reveal which)
- Rate limiting on register/login (10 requests per 15 min)
- Collectors cannot login until approved by admin
- Coordinates validated for range (lat: -90 to 90, lng: -180 to 180)
- Role validation — cannot register as admin via API
- Collector details (phone, vehicleNumber) required at registration

## Missing (Not Yet Implemented)

- Helmet security headers
- Global error handler
- Pagination on user list
- Email format validation
- Stronger password policy (>6 chars)
- Rate limiting on refresh/logout endpoints
- CORS origin whitelist
- Body size limit on JSON parser
- Lean queries for performance
- Multi-device refresh token support
