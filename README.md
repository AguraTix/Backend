# AGURA Ticketing App Backend

This is the backend for the AGURA Ticketing App, providing all APIs implementation.

## Setup Instructions

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd agura-ticketing-backend/backend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the backend directory with the following variables:
   ```env
    DATABASE_URL=postgres://username:password@localhost:5432/agura_tickets
    JWT_SECRET=your_jwt_secret_key
    PORT=3000
   ```

4. **Run the backend:**
   ```sh
   npm run dev
   ```
   The server will run on `http://localhost:3000` by default.

## API Endpoints

### 1. Register User
- **Endpoint:** `POST /api/users/register`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword",
    "name": "User Name",
    "phone_number": "1234567890"
  }
  ```
- **Note:** The role is set to `Attendee` by default.

### 2. Login User
- **Endpoint:** `POST /api/users/login`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

### 3. Update User Role (Admin Only)
- **Endpoint:** `PUT /api/users/{id}/role`
- **Path Parameter:** `id` (User's UUID)
- **Request Body:**
  ```json
  {
    "role": "Admin"
  }
  ```


## Swagger API Documentation

- After starting the server, access the API docs at: `http://localhost:3000/api-docs`

## Project Structure

- `controllers/` - Route handlers for API endpoints
- `models/` - Database models
- `routes/` - API route definitions
- `services/` - Business logic
- `.env` - Environment variables (not committed)

## Notes
- Ensure your database is running and accessible with the credentials in your `.env` file.
