# SuperAdmin Feature Documentation

## Overview
The SuperAdmin feature introduces a hierarchical admin system where:
- **SuperAdmin**: Has full access to all data and can create other admins
- **Admin**: Can only view and manage their own created content (venues, events, foods, orders)
- **Attendee**: Regular users (unchanged)

## Database Changes

### User Model Updates
1. Added `SuperAdmin` to role enum: `['Attendee', 'Admin', 'SuperAdmin']`
2. Added `created_by` field to track which SuperAdmin created an Admin

```sql
-- Migration to add SuperAdmin role and created_by field
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check,
  ADD CONSTRAINT users_role_check CHECK (role IN ('Attendee', 'Admin', 'SuperAdmin'));

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(user_id);
```

## SuperAdmin Capabilities

### 1. Create Admin Accounts
SuperAdmin can create admin accounts without requiring the admin to register themselves.

**Endpoint:** `POST /api/users/superadmin/create-admin`

**Request:**
```json
{
  "email": "admin@example.com",
  "name": "John Admin",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Admin account created and login email sent successfully",
  "user_id": "uuid",
  "email": "admin@example.com",
  "name": "John Admin"
}
```

**What Happens:**
1. SuperAdmin provides admin's email and name
2. System generates temporary password and verification code
3. Email is sent to the new admin with login credentials
4. Admin can log in and should change password immediately

### 2. View All Admins
SuperAdmin can view all admins in the system.

**Endpoint:** `GET /api/users/superadmin/all-admins`

**Response:**
```json
{
  "admins": [
    {
      "user_id": "uuid",
      "email": "admin1@example.com",
      "name": "Admin One",
      "phone_number": "+1234567890",
      "role": "Admin",
      "created_by": "superadmin-uuid",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "Creator": {
        "user_id": "superadmin-uuid",
        "name": "Super Admin",
        "email": "superadmin@example.com"
      }
    }
  ]
}
```

### 3. View My Created Admins
SuperAdmin can view only the admins they created.

**Endpoint:** `GET /api/users/superadmin/my-admins`

**Response:**
```json
{
  "admins": [
    {
      "user_id": "uuid",
      "email": "admin1@example.com",
      "name": "Admin One",
      "phone_number": "+1234567890",
      "role": "Admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4. View All Data
SuperAdmin can view ALL:
- Venues (all admins' venues)
- Events (all admins' events)
- Foods (all admins' foods)
- Food Orders (all admins' orders)

### 5. Update/Delete Any Resource
SuperAdmin can update or delete any venue, event, food, or order regardless of who created it.

## Admin Capabilities (Regular Admin)

### 1. View Only Own Data
Regular admins can only view:
- Their own venues
- Their own events
- Their own foods
- Orders for their foods

### 2. Manage Only Own Resources
Regular admins can only update/delete resources they created.

## Data Filtering Logic

### Venues
```javascript
// Admin sees only their venues
GET /api/venues
// SuperAdmin sees all venues
```

### Events
```javascript
// Admin sees only their events
GET /api/events
// SuperAdmin sees all events
```

### Foods
```javascript
// Admin sees only their foods
GET /api/foods
// SuperAdmin sees all foods
```

### Food Orders
```javascript
// Admin sees only orders for their foods
GET /api/food-orders
// SuperAdmin sees all orders
```

## Creating the First SuperAdmin

The first SuperAdmin must be created manually in the database:

```sql
-- Create SuperAdmin account
INSERT INTO users (user_id, email, name, password, role, phone_number)
VALUES (
  gen_random_uuid(),
  'superadmin@agura.com',
  'Super Administrator',
  '$2b$10$hashedPasswordHere', -- Use bcrypt to hash password
  'SuperAdmin',
  '+1234567890'
);
```

Or use this Node.js script:

```javascript
const bcrypt = require('bcrypt');
const { User } = require('./models');

async function createSuperAdmin() {
  const hashedPassword = await bcrypt.hash('YourSecurePassword123!', 10);
  
  const superAdmin = await User.create({
    email: 'superadmin@agura.com',
    name: 'Super Administrator',
    password: hashedPassword,
    role: 'SuperAdmin',
    phone_number: '+1234567890'
  });
  
  console.log('SuperAdmin created:', superAdmin.email);
}

createSuperAdmin();
```

## Email Template for New Admins

When SuperAdmin creates an admin, the new admin receives an email with:

**Subject:** Your AGURA Admin Account Has Been Created

**Content:**
- Welcome message
- Login credentials (email + temporary password)
- Verification code
- Instructions to change password
- Security notice

## Security Considerations

1. **Temporary Passwords**: Generated passwords are random and should be changed immediately
2. **Verification Codes**: Valid for 24 hours
3. **Role Validation**: All endpoints check user role before allowing access
4. **Data Isolation**: Admins cannot access other admins' data
5. **SuperAdmin Protection**: Only SuperAdmin can create other admins

## API Endpoints Summary

### SuperAdmin Only
- `POST /api/users/superadmin/create-admin` - Create new admin
- `GET /api/users/superadmin/all-admins` - View all admins
- `GET /api/users/superadmin/my-admins` - View my created admins

### Admin & SuperAdmin
- `GET /api/venues` - View venues (filtered by role)
- `GET /api/events` - View events (filtered by role)
- `GET /api/foods` - View foods (filtered by role)
- `GET /api/food-orders` - View orders (filtered by role)
- `PUT /api/venues/:id` - Update venue (SuperAdmin can update any)
- `DELETE /api/venues/:id` - Delete venue (SuperAdmin can delete any)

## Testing the Feature

### 1. Create SuperAdmin
```bash
# Run the script to create first SuperAdmin
node scripts/createSuperAdmin.js
```

### 2. Login as SuperAdmin
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "superadmin@agura.com",
    "password": "YourSecurePassword123!"
  }'
```

### 3. Create Admin Account
```bash
curl -X POST http://localhost:3000/api/users/superadmin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN" \
  -d '{
    "email": "admin@example.com",
    "name": "John Admin",
    "phone_number": "+1234567890"
  }'
```

### 4. Check Email
The new admin will receive an email with login credentials.

### 5. Login as Admin
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@example.com",
    "password": "TEMP_PASSWORD_FROM_EMAIL"
  }'
```

### 6. Test Data Filtering
```bash
# As Admin - see only own venues
curl -X GET http://localhost:3000/api/venues \
  -H "Authorization: Bearer ADMIN_TOKEN"

# As SuperAdmin - see all venues
curl -X GET http://localhost:3000/api/venues \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"
```

## Migration Guide

If you have existing admins in your database:

1. **Backup your database first!**
2. Run the migration to add `created_by` column
3. Existing admins will have `created_by = NULL`
4. Create your first SuperAdmin
5. Optionally update existing admins to link them to SuperAdmin:

```sql
UPDATE users 
SET created_by = (SELECT user_id FROM users WHERE role = 'SuperAdmin' LIMIT 1)
WHERE role = 'Admin' AND created_by IS NULL;
```

## Troubleshooting

### Issue: Admin can't see their data
**Solution:** Check that the admin's `user_id` matches the `admin_id` in venues/events/foods

### Issue: SuperAdmin can't create admins
**Solution:** Verify the SuperAdmin role is set correctly and JWT token includes role

### Issue: Email not sending
**Solution:** Check SMTP configuration in `.env` file

### Issue: Temporary password not working
**Solution:** Check that password was copied correctly from email (no extra spaces)