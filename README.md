# miniDrive

A full-stack mini drive app where users can register/login, upload files, and view/download their own uploads.

Live App: https://minidrive-8f5p.onrender.com

## Overview

`miniDrive` is built with Node.js + Express + EJS.  
It uses JWT cookie auth for protected routes and a split storage design:

- File binary data -> Firebase Realtime Database (Base64)
- File metadata + users -> MongoDB (Mongoose)

This gives simple auth/query flow with ownership checks on each file action.

## Features

- User registration with validation
- Login using email or username
- JWT-based auth (HTTP-only cookie)
- Protected dashboard (`/home`)
- File upload with duplicate check (SHA-256 hash per user)
- File listing per logged-in user
- File view in browser
- File download as attachment
- Logout support
- HTML form flow + JSON API-friendly responses

## Tech Stack

- Backend: Node.js, Express
- Views/UI: EJS, Tailwind (CDN), Flowbite
- Auth/Security: JWT (`jsonwebtoken`), `bcrypt`, `cookie-parser`
- Validation: `express-validator`
- Database: MongoDB Atlas + Mongoose
- File Storage: Firebase Admin SDK (Realtime Database)
- Upload Handling: Multer (`memoryStorage`)
- Config: `dotenv`
- Hosting: Render

## Project Structure

```text
miniDrive/
├─ app.js
├─ config/
│  ├─ db.js
│  ├─ firebase.config.js
│  └─ multer.config.js
├─ middleware/
│  └─ auth.js
├─ models/
│  ├─ user.model.js
│  └─ file.model.js
├─ routes/
│  ├─ user.routes.js
│  └─ index.routes.js
├─ views/
│  ├─ login.ejs
│  ├─ register.ejs
│  ├─ home.ejs
│  └─ index.ejs
└─ .env
```

## Environment Variables

Create a `.env` file in project root:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=1h
NODE_ENV=development
FIREBASE_DATABASE_URL=https://<your-project>.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Notes:
- In production (Render), set env vars in Render dashboard.
- `FIREBASE_SERVICE_ACCOUNT_JSON` must be a single-line JSON string.
- Never commit `.env` or Firebase private key JSON to Git.

## Local Setup

1. Clone the repo
2. Install dependencies
3. Configure `.env`
4. Run server

```bash
npm install
npm run dev
```

or

```bash
npm start
```

App runs on:

```txt
http://localhost:5000
```

## Deployment (Render)

Recommended Render settings:

- Build Command: `npm install`
- Start Command: `node app.js` (or `npm start`)
- Branch: `main`
- Region: Oregon (US West)

Required env vars on Render:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV=production`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

## Route Summary

Auth routes:
- `GET /user/register`
- `POST /user/register`
- `GET /user/login`
- `POST /user/login`
- `POST /user/logout`

Protected routes:
- `GET /home`
- `POST /upload`
- `GET /file/:id/view`
- `GET /file/:id/download`

## Security Notes

- Use strong secrets and rotate compromised keys/passwords immediately.
- Keep service account JSON private.
- For production hardening, add rate limiting and stricter upload limits.

## License

ISC
