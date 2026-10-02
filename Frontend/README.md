# Hospital Management System — API Reference

This file documents every backend endpoint with exact JSON request/response
shapes, generated directly from the Spring Boot source code. Use this as the
single source of truth when building the frontend — do not guess field names.

**Base URL:** `http://localhost:8080` (no context path)
**Auth header** (all endpoints except `Public` rows): `Authorization: Bearer <jwt>`
**Access token expiry:** 15 minutes. **Refresh token expiry:** 7 days, single-use (rotates on every refresh).

## Standard error response
Every error (validation, 401, 403, 404, 409, 422, 500) returns this shape —
`fieldErrors` is only present on validation errors:
```json
{
  "timestamp": "2026-09-29T10:15:30",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "Validation failed for one or more fields",
  "path": "/auth/signup",
  "fieldErrors": [
    { "field": "username", "message": "Username must be a valid email address" }
  ]
}
```

## Enums used across this API
- `RoleType`: `ADMIN`, `DOCTOR`, `PATIENT`
- `AppointmentStatus`: `BOOKED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
- `BillStatus`: `PENDING`, `PAID`, `PARTIALLY_PAID`, `CANCELLED`
- `PaymentMethod`: `CASH`, `CARD`, `UPI`
- `BloodGroup`: `A`, `B`, `AB`, `O`
- `DayOfWeek` (Java standard): `MONDAY`...`SUNDAY`

---

## 1. AUTH

### 1.1 POST /auth/signup — Public
Creates a new user. Role is always `PATIENT` (cannot be set by the caller).

Request:
```json
{
  "username": "jane.doe@example.com",
  "password": "Passw0rd!",
  "name": "Jane Doe"
}
```
Rules: `username` required, valid email. `password` required, 8–64 chars, needs 1 uppercase, 1 lowercase, 1 digit, 1 of `@$!%*?&`. `name` required, max 100 chars.

Response `200 OK`:
```json
{
  "id": 12,
  "username": "jane.doe@example.com"
}
```

### 1.2 POST /auth/login — Public
Request:
```json
{
  "username": "jane.doe@example.com",
  "password": "Passw0rd!"
}
```
Response `200 OK`:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 12,
  "refreshToken": "c3VwZXItc2VjcmV0LXJhbmRvbS10b2tlbg"
}
```
`401` on bad credentials: `"message": "Invalid username or password"`.

### 1.3 POST /auth/refresh — Public
Request:
```json
{
  "refreshToken": "c3VwZXItc2VjcmV0LXJhbmRvbS10b2tlbg"
}
```
Response `200 OK` — a NEW access + refresh token pair (old refresh token is now revoked):
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiJ9...(new)",
  "userId": 12,
  "refreshToken": "bmV3LXJlZnJlc2gtdG9rZW4"
}
```
Errors (both `401`):
```json
{ "status": 401, "code": "TOKEN_INVALID", "message": "Invalid refresh token", "path": "/auth/refresh" }
```
```json
{ "status": 401, "code": "TOKEN_EXPIRED", "message": "Refresh token has expired", "path": "/auth/refresh" }
```
Reusing an already-used refresh token revokes ALL of that user's refresh tokens (theft protection) — the frontend must always overwrite its stored refresh token after every refresh call.

### 1.4 POST /auth/logout — Authenticated (needs JWT)
Request:
```json
{
  "refreshToken": "c3VwZXItc2VjcmV0LXJhbmRvbS10b2tlbg"
}
```
Response `200 OK`, empty body.

### 1.5 GET /oauth2/authorization/google — Public
### 1.6 GET /oauth2/authorization/github — Public
Not JSON APIs — redirect the browser to these URLs. After the provider flow
completes, the backend writes the same JSON as 1.2 directly to the response:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 12,
  "refreshToken": "c3VwZXItc2VjcmV0LXJhbmRvbS10b2tlbg"
}
```

---

## 2. PUBLIC DOCTORS & DEPARTMENTS (no auth)

### 2.1 GET /public/doctors — Public
Query: `name`, `specialization`, `departmentId` (all optional), `page` (default 0), `size` (default 10, max 100), `sort` (default `id,asc`).
```
GET /public/doctors?specialization=Cardiology&page=0&size=10&sort=name,asc
```
Response `200 OK`:
```json
{
  "content": [
    { "id": 3, "name": "Dr. Alan Grant", "specialization": "Cardiology", "email": "alan.grant@hospital.com" }
  ],
  "pageable": { "pageNumber": 0, "pageSize": 10 },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "numberOfElements": 1
}
```
Note: no `consultationFee` or `departmentId` field returned, even though the entity has them.

### 2.2 GET /public/doctors/{id} — Public
```json
{ "id": 3, "name": "Dr. Alan Grant", "specialization": "Cardiology", "email": "alan.grant@hospital.com" }
```
`404` if not found.

### 2.3 GET /public/departments — Public
Query: `page`, `size` (max 100).
```json
{
  "content": [ { "id": 1, "name": "Cardiology", "headDoctorId": 3 } ],
  "totalElements": 1,
  "totalPages": 1
}
```

---

## 3. DOCTOR SELF-SERVICE (`/doctor/**` — role DOCTOR or ADMIN unless noted)

### 3.1 GET /doctor
Query: `page` (default 0), `size` (default 10, max 100). Same `Page<DoctorDto>` shape as 2.1.

### 3.2 GET /doctor/all
Plain array, no pagination:
```json
[ { "id": 3, "name": "Dr. Alan Grant", "specialization": "Cardiology", "email": "alan.grant@hospital.com" } ]
```

### 3.3 GET /doctor/{id}
Same shape as 2.2.

### 3.4 GET /doctor/appointments
Logged-in doctor's own appointments (doctor identity from JWT, no params).
```json
[
  {
    "id": 45,
    "appointmentTime": "2026-10-02T10:30:00",
    "reason": "Chest pain follow-up",
    "doctor": { "id": 3, "name": "Dr. Alan Grant", "specialization": "Cardiology", "email": "alan.grant@hospital.com" },
    "status": "BOOKED",
    "cancelledBy": null,
    "cancelReason": null
  }
]
```
Note: no patient name/id is included, only the nested doctor.

### 3.5 POST /doctor/availability — role DOCTOR only
Replaces the doctor's whole weekly schedule (identity from JWT).
Request:
```json
{
  "availabilities": [
    { "dayOfWeek": "MONDAY", "startTime": "09:00:00", "endTime": "13:00:00" },
    { "dayOfWeek": "WEDNESDAY", "startTime": "14:00:00", "endTime": "18:00:00" }
  ]
}
```
Response `200 OK`:
```json
{
  "doctorId": 3,
  "availabilities": [
    { "id": 10, "dayOfWeek": "MONDAY", "startTime": "09:00:00", "endTime": "13:00:00" },
    { "id": 11, "dayOfWeek": "WEDNESDAY", "startTime": "14:00:00", "endTime": "18:00:00" }
  ]
}
```

### 3.6 GET /doctor/availability — role DOCTOR only
Own schedule. Same response shape as 3.5.

### 3.7 GET /doctor/{id}/availability
Any doctor's schedule by id. Same response shape as 3.5.

### 3.8 POST /doctor/leave — role DOCTOR only
Request:
```json
{
  "leaveDate": "2026-10-10",
  "reason": "Conference"
}
```
`leaveDate` required, today or future. `reason` optional, max 255 chars.
Response `200 OK`:
```json
{ "id": 5, "doctorId": 3, "leaveDate": "2026-10-10", "reason": "Conference" }
```

### 3.9 GET /doctor/slots
Query: `doctorId` (required), `date` (required, `YYYY-MM-DD`).
```
GET /doctor/slots?doctorId=3&date=2026-10-02
```
Response `200 OK`:
```json
{
  "date": "2026-10-02",
  "doctorId": 3,
  "availableSlots": ["09:00:00", "09:30:00", "10:00:00", "10:30:00"]
}
```

---

## 4. APPOINTMENTS (`/appointments/**` — any authenticated user; ownership enforced server-side)

### 4.1 POST /appointments
Patient books; patient identity comes from the JWT, not the body.
Request:
```json
{
  "doctorId": 3,
  "appointmentTime": "2026-10-02T10:30:00",
  "reason": "Chest pain follow-up"
}
```
`appointmentTime` must be in the future.
Response `201 Created`:
```json
{
  "id": 45,
  "appointmentTime": "2026-10-02T10:30:00",
  "reason": "Chest pain follow-up",
  "doctor": { "id": 3, "name": "Dr. Alan Grant", "specialization": "Cardiology", "email": "alan.grant@hospital.com" },
  "status": "BOOKED",
  "cancelledBy": null,
  "cancelReason": null
}
```

### 4.2 POST /appointments/{id}/cancel
Body optional:
```json
{ "reason": "Patient requested reschedule" }
```
`reason` optional, max 300 chars. Response `200 OK`: same shape as 4.1 with `status: "CANCELLED"`.

### 4.3 POST /appointments/{id}/reschedule
Request:
```json
{ "newAppointmentTime": "2026-10-05T11:00:00" }
```
Must be in the future. Response `200 OK`: same shape as 4.1 with updated time.

### 4.4 PATCH /appointments/{id}/status
Generic status transition — used for confirm, complete, AND no-show.
Request:
```json
{ "status": "CONFIRMED" }
```
`status` is one of `BOOKED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.
Response `200 OK`: same shape as 4.1 with the new status.
> There is no separate `/confirm`, `/complete`, or `/no-show` route — build one frontend action per status value against this single endpoint.

---

## 5. MEDICAL RECORDS

### 5.1 POST /doctor/appointments/{id}/record — role DOCTOR, `record:write`
`{id}` is the appointment id.
Request:
```json
{
  "diagnosis": "Mild hypertension",
  "notes": "Recommend low-sodium diet and follow-up in 2 weeks",
  "followUpDate": "2026-10-16",
  "prescriptions": [
    { "medicineName": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "durationDays": 14, "instructions": "Take in the morning with food" }
  ]
}
```
`diagnosis` required, max 1000 chars. `prescriptions` optional; each needs `medicineName` required, `durationDays` positive if present.
Response `201 Created`:
```json
{
  "id": 20,
  "appointmentId": 45,
  "doctorId": 3,
  "patientId": 12,
  "diagnosis": "Mild hypertension",
  "notes": "Recommend low-sodium diet and follow-up in 2 weeks",
  "followUpDate": "2026-10-16",
  "prescriptions": [
    { "id": 30, "medicineName": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "durationDays": 14, "instructions": "Take in the morning with food", "createdAt": "2026-09-29T10:00:00", "updatedAt": "2026-09-29T10:00:00" }
  ],
  "createdAt": "2026-09-29T10:00:00",
  "updatedAt": "2026-09-29T10:00:00"
}
```

### 5.2 PUT /doctor/records/{id} — role DOCTOR, `record:write`
`{id}` is the record id. Same request/response shape as 5.1.

### 5.3 GET /patient/records — role PATIENT, `record:read`
Query: `page`, `size`.
```json
{
  "content": [ /* MedicalRecordResponseDto, shape as in 5.1 */ ],
  "totalElements": 1,
  "totalPages": 1
}
```

### 5.4 GET /patient/records/{id} — role PATIENT, `record:read`, must own it
Same shape as 5.1.

### 5.5 GET /doctor/patients/{patientId}/records — role DOCTOR, `record:read`
Query: `page`, `size`. Same `Page<MedicalRecordResponseDto>` shape as 5.3.

### 5.6 GET /admin/records/{id} — role ADMIN, `record:read`
Read-only audit view. Same shape as 5.1.

---

## 6. BILLING

### 6.1 POST /admin/bills/generate/{appointmentId} — role ADMIN, `bill:write`
Request:
```json
{ "medicineCharges": 250.00, "otherCharges": 50.00 }
```
Both required, zero or positive.
Response `201 Created`:
```json
{
  "id": 8,
  "appointmentId": 45,
  "consultationFee": 500.00,
  "medicineCharges": 250.00,
  "otherCharges": 50.00,
  "insuranceCovered": 560.00,
  "totalAmount": 800.00,
  "patientPayable": 240.00,
  "status": "PENDING",
  "createdAt": "2026-09-29T10:05:00",
  "payments": []
}
```

### 6.2 GET /patient/bills — role PATIENT, `bill:read`
Query: `status` (optional), `page`, `size`.
```json
{ "content": [ /* BillResponseDto, shape as in 6.1 */ ], "totalElements": 1, "totalPages": 1 }
```

### 6.3 GET /patient/bills/{id} — role PATIENT, `bill:read`, must own it
Same shape as 6.1.

### 6.4 POST /patient/bills/{id}/pay — role PATIENT, `bill:write`
Request:
```json
{
  "amount": 240.00,
  "method": "CARD",
  "transactionRef": "TXN-88213",
  "idempotencyKey": "a3f9c2e1-4b7d-4e2a-9c1f-8d6e5b3a2c10"
}
```
`amount` required, positive. `method` required (`CASH`/`CARD`/`UPI`). `idempotencyKey` required — generate a random UUID client-side per attempt so a double-click can't double-charge.
Response `200 OK`: `BillResponseDto` with updated `status` and a new entry in `payments`:
```json
{
  "id": 8,
  "appointmentId": 45,
  "consultationFee": 500.00,
  "medicineCharges": 250.00,
  "otherCharges": 50.00,
  "insuranceCovered": 560.00,
  "totalAmount": 800.00,
  "patientPayable": 240.00,
  "status": "PAID",
  "createdAt": "2026-09-29T10:05:00",
  "payments": [
    { "id": 15, "amount": 240.00, "method": "CARD", "transactionRef": "TXN-88213", "paidAt": "2026-09-29T10:10:00" }
  ]
}
```

### 6.5 GET /admin/bills — role ADMIN, `bill:read`
Query: `status`, `from`, `to` (ISO date-time e.g. `2026-09-01T00:00:00`), `page`, `size`. Same `Page<BillResponseDto>` shape as 6.1.

---

## 7. INSURANCE (`/patient/insurance` — role PATIENT)

### 7.1 POST /patient/insurance
Request:
```json
{
  "policyNumber": "POL-99231",
  "provider": "Star Health",
  "validUntil": "2027-03-31",
  "coveragePercent": 70
}
```
`policyNumber` and `provider` required.
Response `200 OK` — returns the **patient**, not the insurance:
```json
{ "id": 12, "name": "Jane Doe", "birthDate": "1990-05-14", "email": "jane.doe@example.com", "gender": "Female", "bloodGroup": "O" }
```

### 7.2 DELETE /patient/insurance
No body. Response `200 OK`: same `PatientDto` shape as 7.1, insurance removed.

### 7.3 GET /patient/insurance
```json
{ "id": 4, "policyNumber": "POL-99231", "provider": "Star Health", "validUntil": "2027-03-31", "coveragePercent": 70 }
```

---

## 8. DEPARTMENTS (role ADMIN for writes, public read is 2.3)

### 8.1 POST /admin/departments
Request:
```json
{ "name": "Cardiology", "headDoctorId": 3 }
```
`name` required, `headDoctorId` optional.
Response `201 Created`:
```json
{ "id": 1, "name": "Cardiology", "headDoctorId": 3 }
```

### 8.2 PUT /admin/departments/{id}
Same request/response shape as 8.1.

### 8.3 DELETE /admin/departments/{id}
Response `204 No Content`.

### 8.4 POST /admin/departments/{id}/doctors/{doctorId}
No body. Response `200 OK`: `DepartmentDto` (shape as 8.1).

### 8.5 DELETE /admin/departments/{id}/doctors/{doctorId}
No body. Response `200 OK`: `DepartmentDto`.

### 8.6 PUT /admin/departments/{id}/head/{doctorId}
No body. Response `200 OK`: `DepartmentDto`.

---

## 9. ADMIN

### 9.1 GET /admin/patients — role ADMIN
Query: `name`, `bloodGroup`, `bornAfter` (`YYYY-MM-DD`), `page`, `size`.
```json
{
  "content": [
    { "id": 12, "name": "Jane Doe", "birthDate": "1990-05-14", "email": "jane.doe@example.com", "gender": "Female", "bloodGroup": "O" }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

### 9.2 POST /admin/onBoardNewDoctor — ⚠️ no role check in code (bug — any logged-in user can call this today)
Request:
```json
{
  "userId": 20,
  "name": "Dr. Alan Grant",
  "specialization": "Cardiology",
  "email": "alan.grant@hospital.com"
}
```
`userId` must be an existing user's id (they must have signed up first).
Response `201 Created`:
```json
{ "id": 3, "name": "Dr. Alan Grant", "specialization": "Cardiology", "email": "alan.grant@hospital.com" }
```

### 9.3 GET /admin/dashboard — role ADMIN
No params.
```json
{
  "totalPatients": 142,
  "totalDoctors": 18,
  "appointmentsToday": 9,
  "appointmentsByStatus": { "BOOKED": 5, "CONFIRMED": 2, "COMPLETED": 30, "CANCELLED": 4, "NO_SHOW": 1 },
  "appointmentsPerDoctor": [ { "doctorName": "Dr. Alan Grant", "count": 12 } ],
  "bloodGroupCounts": [ { "bloodGroup": "O", "count": 40 }, { "bloodGroup": "A", "count": 35 } ],
  "revenueThisMonth": 45230.50,
  "pendingBillsCount": 7
}
```

### 9.4 GET /admin/users — role ADMIN, `user:manage`
Query: `role` (optional), `page`, `size`.
Returns `Page<Object>` (untyped, raw entity serialization) — call it once against a running backend and inspect the real JSON before wiring the frontend to it; do not hardcode its field names from this doc.

### 9.5 PUT /admin/users/{id}/roles — role ADMIN, `user:manage`
Request is a raw JSON array, NOT wrapped in an object:
```json
["DOCTOR", "PATIENT"]
```
Response `200 OK`, empty body.

### 9.6 PUT /admin/users/{id}/disable — role ADMIN, `user:manage`
No body. Response `200 OK`, empty body.

### 9.7 PUT /admin/users/{id}/enable — role ADMIN, `user:manage`
No body. Response `200 OK`, empty body.

---

## Role / path access rules (from WebSecurityConfig)

| Path prefix | Access |
|---|---|
| `/auth/logout` | Requires a valid JWT (checked before the rule below) |
| `/auth/**` (everything else), `/public/**` | Anyone, no token |
| `/admin/**` (DELETE method only) | Needs BOTH `appointment:delete` AND `user:manage` authorities — likely a bug, a normal admin without both will get 403 on admin deletes |
| `/admin/**` (all other methods) | Role ADMIN |
| `/patient/**` | Role PATIENT or ADMIN |
| `/doctor/**` | Role DOCTOR or ADMIN |
| everything else (including `/appointments/**`) | Any authenticated user — ownership is checked in the service layer, not the URL rule |

## Known quirks to design the frontend around
1. Refresh tokens are single-use — always store the NEW `refreshToken` from every `/auth/refresh` response, discard the old one.
2. `PATCH /appointments/{id}/status` handles confirm/complete/no-show — no separate routes exist for these.
3. `AppointmentResponseDto` never includes the patient's name/id, only the nested doctor.
4. `DoctorDto` never exposes `consultationFee` or `departmentId`, even though the entity has both.
5. `GET /admin/users` returns untyped data — verify its shape live before building against it.
6. `POST /admin/onBoardNewDoctor` has no role restriction server-side — don't rely on the frontend hiding the button as the only protection.