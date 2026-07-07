# Future Bin — Database Schema Design

## Tech Stack

- **Database:** MongoDB (NoSQL document store)
- **ODM:** Mongoose v9.7.0
- **Naming Convention:** camelCase for fields, PascalCase for model names, pluralized lowercase collection names

---

## 1. Current Model (Implemented)

### `User` — `users` collection

A single-table (single-collection) design with role-based polymorphism.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | required | Full name |
| `email` | String | required, unique, lowercase | Login identifier |
| `password` | String | required, minlength(6), select: false | bcrypt-hashed |
| `role` | String | enum: resident / collector / admin, default: resident | User type |
| `emailVerified` | Boolean | default: false | OTP verification flag |
| `verificationOtp` | String | select: false | Email verification code |
| `verificationOtpExpires` | Date | select: false | OTP expiry timestamp |
| `resetPasswordOtp` | String | select: false | Password reset code |
| `resetPasswordOtpExpires` | Date | select: false | Reset OTP expiry |
| `isApproved` | Boolean | default: true (resident), false (collector) | Admin approval flag |
| `isAvailable` | Boolean | default: false | Collector availability toggle |
| `collectorDetails` | Embedded | conditional on role === collector | Nested subdocument |
| `collectorDetails.phone` | String | required if collector | Contact number |
| `collectorDetails.vehicleNumber` | String | required if collector | Vehicle plate/ID |
| `collectorDetails.vehiclePhoto` | String | Cloudinary URL | Vehicle image |
| `collectorDetails.idProof` | String | Cloudinary URL | Identity document |
| `refreshToken` | String | select: false | JWT refresh token |
| `location` | GeoJSON | 2dsphere sparse index | Point `[lng, lat]` |
| `createdAt` | Date | auto via timestamps | Document creation time |
| `updatedAt` | Date | auto via timestamps | Document update time |

**Indexes:**
- `{ email: 1 }` — unique (default Mongoose behavior)
- `{ location: "2dsphere" }` — sparse (only collectors have location)

**Validation Rules:**
- `collectorDetails` subdocument is required/validated only when `role === "collector"`
- Password is excluded from query results by default (`select: false`)

---

## 2. Proposed Models (Future Implementation)

These entities are inferred from the domain (waste collection management) and placeholder UI sections found in the frontend.

---

### `CollectionRequest` — `collectionrequests` collection

Represents a waste pickup request submitted by a resident.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `resident` | ObjectId | ref: User, required | Who requested |
| `collector` | ObjectId | ref: User, nullable | Assigned collector |
| `status` | String | enum: pending / assigned / in_progress / completed / cancelled, default: pending | Lifecycle state |
| `wasteType` | String | enum: general / recyclable / organic / hazardous / electronic | Category of waste |
| `scheduledDate` | Date | required | Preferred pickup date |
| `scheduledTimeSlot` | String | e.g. "09:00-12:00" | Preferred time window |
| `address` | String | required | Pickup location text |
| `location` | GeoJSON | Point `[lng, lat]` | Precise pickup coordinates |
| `notes` | String | maxlength(500) | Special instructions |
| `photos` | [String] | Cloudinary URLs | Waste images |
| `completedAt` | Date | nullable | Actual completion timestamp |
| `createdAt` | Date | auto | Request submission time |
| `updatedAt` | Date | auto | Last update time |

**Indexes:**
- `{ resident: 1, status: 1 }` — resident's requests by status
- `{ collector: 1, status: 1 }` — collector's assignments
- `{ location: "2dsphere" }` — geospatial queries for nearby requests
- `{ scheduledDate: 1, status: 1 }` — daily scheduling queries

---

### `WasteBin` — `wastebins` collection

Represents a physical waste bin (smart or standard) at a location.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `resident` | ObjectId | ref: User, required | Owner |
| `binType` | String | enum: general / recyclable / organic | Bin category |
| `size` | String | enum: small / medium / large | Capacity tier |
| `location` | GeoJSON | Point, required | Bin placement coordinates |
| `address` | String | | Human-readable address |
| `fillLevel` | Number | 0–100, default: 0 | Current fill percentage |
| `lastEmptied` | Date | nullable | Last collection time |
| `isActive` | Boolean | default: true | Soft-delete / deactivation |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes:**
- `{ resident: 1 }` — bins owned by a user
- `{ location: "2dsphere" }` — geospatial queries
- `{ fillLevel: -1, location: "2dsphere" }` — high-priority bins nearby

---

### `Notification` — `notifications` collection

In-app notifications for all user roles.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `recipient` | ObjectId | ref: User, required | Target user |
| `type` | String | enum: collection_reminder / status_update / approval / system / general | Category |
| `title` | String | required | Short headline |
| `message` | String | required | Notification body |
| `referenceModel` | String | nullable | Related entity name (e.g. "CollectionRequest") |
| `referenceId` | ObjectId | nullable | Related entity ID |
| `isRead` | Boolean | default: false | Read status |
| `createdAt` | Date | auto | |

**Indexes:**
- `{ recipient: 1, isRead: 1, createdAt: -1 }` — unread notifications, newest first
- `{ createdAt: 1 }` with TTL (optional auto-cleanup)

---

### `Review` — `reviews` collection

Allows residents to rate collectors after a completed collection.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `resident` | ObjectId | ref: User, required | Reviewer |
| `collector` | ObjectId | ref: User, required | Reviewee |
| `collectionRequest` | ObjectId | ref: CollectionRequest, unique | One review per request |
| `rating` | Number | 1–5, required | Star rating |
| `comment` | String | maxlength(500) | Optional feedback |
| `createdAt` | Date | auto | |

**Indexes:**
- `{ collector: 1, createdAt: -1 }` — collector's reviews
- `{ collectionRequest: 1 }` — unique (one review per request)

---

### `Payout` — `payouts` collection

Tracks payments/earnings for collectors.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `collector` | ObjectId | ref: User, required | Payee |
| `amount` | Number | required, min: 0 | Payout amount |
| `currency` | String | default: "LKR" | Currency code |
| `status` | String | enum: pending / processed / failed, default: pending | Lifecycle |
| `completedRequests` | Number | default: 0 | Count of requests in payout |
| `paymentMethod` | String | nullable | Bank account / mobile money |
| `processedAt` | Date | nullable | When processed |
| `createdAt` | Date | auto | |

**Indexes:**
- `{ collector: 1, status: 1, createdAt: -1 }` — collector's payout history
- `{ status: 1 }` — admin queries for pending payouts

---

## 3. Entity Relationship Diagram (Logical)

```
┌─────────────┐       ┌──────────────────┐       ┌────────────┐
│    User     │       │ CollectionRequest │       │ WasteBin   │
│─────────────│       │──────────────────│       │────────────│
│ resident ───│──1:N──│ resident          │       │ resident   │
│ collector   │       │ collector ───────│──N:1──│ User       │
│ admin       │       │ location (GeoJSON)│       │ location   │
│ location ───│──1:N──│ scheduledDate     │       │ fillLevel  │
│             │       │ status            │       │ binType    │
└──────┬──────┘       └────────┬─────────┘       └────────────┘
       │                       │
       │ 1:N                   │ 1:1
       │                       │
       ▼                       ▼
┌──────────────┐      ┌──────────────┐
│ Notification │      │    Review    │
│──────────────│      │──────────────│
│ recipient    │      │ resident     │
│ type         │      │ collector    │
│ referenceId  │      │ request      │
│ isRead       │      │ rating       │
└──────────────┘      └──────────────┘

┌──────────────┐
│   Payout     │
│──────────────│
│ collector    │
│ amount       │
│ status       │
└──────────────┘
```

### Key Relationships

- **User (resident) 1:N CollectionRequest** — A resident can have many collection requests.
- **User (collector) 1:N CollectionRequest** — A collector can be assigned to many requests.
- **User 1:N WasteBin** — A resident can own multiple bins.
- **User 1:N Notification** — Any user receives many notifications.
- **User (resident) 1:N Review** — A resident writes reviews.
- **User (collector) 1:N Review** — A collector receives reviews.
- **CollectionRequest 1:1 Review** — Each completed request can have exactly one review.
- **User (collector) 1:N Payout** — A collector receives multiple payouts.

---

## 4. Index Strategy Summary

| Collection | Index | Purpose |
|-----------|-------|---------|
| `users` | `{ email: 1 }` | Unique login lookup |
| `users` | `{ location: "2dsphere" }` (sparse) | Find nearby collectors |
| `collectionrequests` | `{ resident: 1, status: 1 }` | Resident's dashboard |
| `collectionrequests` | `{ collector: 1, status: 1 }` | Collector's assignments |
| `collectionrequests` | `{ location: "2dsphere" }` | Match collectors to nearby requests |
| `collectionrequests` | `{ scheduledDate: 1, status: 1 }` | Daily scheduling |
| `wastebins` | `{ resident: 1 }` | Resident's bins |
| `wastebins` | `{ location: "2dsphere" }` | Nearby bins for route optimization |
| `wastebins` | `{ fillLevel: -1, location: "2dsphere" }` | Priority bins (high fill) |
| `notifications` | `{ recipient: 1, isRead: 1, createdAt: -1 }` | User's unread notifs |
| `reviews` | `{ collector: 1, createdAt: -1 }` | Collector's reviews |
| `reviews` | `{ collectionRequest: 1 }` | Unique per request |
| `payouts` | `{ collector: 1, status: 1, createdAt: -1 }` | Collector payout history |

---

## 5. Validation & Business Rules

| Rule | Scope |
|------|-------|
| `collectorDetails` fields required only when `role === "collector"` | User model pre-save hook |
| Only `isApproved === true` collectors can be assigned requests | Application logic |
| A collector's `location` must be updated before they can receive assignments | Application logic |
| `status` transitions: pending → assigned → in_progress → completed (or cancelled from any) | CollectionRequest state machine |
| A review can only be created for a `completed` request | Application logic |
| Fill level is 0–100 (percentage); >90 triggers high-priority flag | WasteBin virtual/application |
| Notifications older than 90 days may be automatically cleaned up | TTL index or cron job |

---

## 6. Migration Strategy

Since MongoDB is schema-less, no formal migrations are needed. To introduce new collections:

1. Create the Mongoose model file in `Backend/src/models/`
2. Add corresponding controller and service files
3. Add routes in `Backend/src/routes/`
4. Deploy — existing documents are unaffected; new collections are created on first write

For adding new fields to existing models, simply add them to the schema. Old documents will use the default value or be handled with `||` fallbacks in application code.
