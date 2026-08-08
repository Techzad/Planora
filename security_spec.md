# Security Specification & Test-Driven Design (TDD)

## 1. Data Invariants
1. **User Ownership**: A user document can only be read or written by the authenticated user whose `uid` matches the document's ID.
2. **Task Ownership & Integrity**: A task document can only be accessed (read/write) if `request.auth.uid` matches the `userId` field of the task.
3. **Calendar Event Ownership**: A cached Google Calendar event document can only be accessed if `request.auth.uid` matches the `userId` field.
4. **ID Format Validation**: All IDs (userId, taskId, eventId) must conform to string type of length <= 128 and match character regex `^[a-zA-Z0-9_\-]+$`.
5. **No Cross-User Leakage**: Reading or listing collections without a user filter is strictly blocked by the rules themselves (Blanket reads are denied).
6. **Task Schema Guarding**: Any task write must conform to strict fields and enums.

---

## 2. The "Dirty Dozen" Attack Payloads

### Payload 1: Identity Spoofing (Write other user's settings)
An attacker attempts to write user profile settings for another user.
```json
{
  "uid": "victim_user_123",
  "name": "Hacker",
  "email": "hacker@evil.com"
}
```
*Expected Result:* `PERMISSION_DENIED` (UID mismatch check)

### Payload 2: Task Hijacking (Create task under another user ID)
An attacker tries to create a task with `userId` set to a victim's ID.
```json
{
  "id": "task_evil_666",
  "userId": "victim_user_123",
  "title": "Malicious Task",
  "dueDate": "2026-08-08",
  "priority": "High",
  "status": "Todo",
  "category": "Work"
}
```
*Expected Result:* `PERMISSION_DENIED` (userId must equal request.auth.uid)

### Payload 3: Value Poisoning (Invalid Task Priority Enum)
An attacker attempts to insert a task with a forbidden/unsupported priority value.
```json
{
  "id": "task_123",
  "userId": "attacker_456",
  "title": "Test Task",
  "dueDate": "2026-08-08",
  "priority": "SuperUltraHigh",
  "status": "Todo",
  "category": "Work"
}
```
*Expected Result:* `PERMISSION_DENIED` (Enum validation failed)

### Payload 4: Value Poisoning (Invalid Task Status Enum)
An attacker attempts to write an invalid status.
```json
{
  "id": "task_123",
  "userId": "attacker_456",
  "title": "Test Task",
  "dueDate": "2026-08-08",
  "priority": "High",
  "status": "NotStartedYet",
  "category": "Work"
}
```
*Expected Result:* `PERMISSION_DENIED` (Enum validation failed)

### Payload 5: Deny-of-Wallet Path Attack (Extremely Long ID)
An attacker attempts to write to a document with an extremely long ID (over 128 chars) to inflate index size and storage costs.
```json
{
  "id": "task_very_long_id_greater_than_128_characters_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "userId": "attacker_456",
  "title": "Costly Task",
  "dueDate": "2026-08-08",
  "priority": "High",
  "status": "Todo",
  "category": "Work"
}
```
*Expected Result:* `PERMISSION_DENIED` (`isValidId` size constraint)

### Payload 6: Shadow Fields Injection
An attacker attempts to inject a sneaky field like `isAdmin: true` into their user settings document to escalate privileges.
```json
{
  "uid": "attacker_456",
  "name": "Attacker",
  "email": "attacker@evil.com",
  "isAdmin": true
}
```
*Expected Result:* `PERMISSION_DENIED` (`affectedKeys().hasOnly(...)` gate)

### Payload 7: Client-Side Read Query Scraping
An authenticated attacker queries the `/tasks` collection without specifying `where("userId", "==", request.auth.uid)`.
```json
{}
```
*Expected Result:* `PERMISSION_DENIED` (Query filter enforcement)

### Payload 8: Mutating Immutable Creation Timestamp
An attacker attempts to update `createdAt` of an existing task.
```json
{
  "createdAt": "2020-01-01T00:00:00Z"
}
```
*Expected Result:* `PERMISSION_DENIED` (Immutability guard)

### Payload 9: Hijack GCal Event (Cross-user edit)
An attacker attempts to modify a GCalEvent belonging to another user.
```json
{
  "id": "gcal_789",
  "userId": "victim_user_123",
  "summary": "Victim Meeting"
}
```
*Expected Result:* `PERMISSION_DENIED` (userId validation match)

### Payload 10: Value Poisoning (Over-sized description field)
An attacker attempts to write a description field of massive length (>10000 characters) to exhaust storage.
```json
{
  "id": "task_123",
  "userId": "attacker_456",
  "title": "A task",
  "dueDate": "2026-08-08",
  "priority": "High",
  "status": "Todo",
  "category": "Work",
  "description": "..." // >10k characters
}
```
*Expected Result:* `PERMISSION_DENIED` (Size validation check)

### Payload 11: Task Category Enum Poisoning
An attacker attempts to set an invalid category.
```json
{
  "id": "task_123",
  "userId": "attacker_456",
  "title": "Test Task",
  "dueDate": "2026-08-08",
  "priority": "High",
  "status": "Todo",
  "category": "ForbiddenCategory"
}
```
*Expected Result:* `PERMISSION_DENIED` (Enum validation failed)

### Payload 12: Unauthenticated Write Attack
A non-logged-in user tries to create a task.
*Expected Result:* `PERMISSION_DENIED` (`isSignedIn()` check)
