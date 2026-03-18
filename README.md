# File Uploader

A cloud based file manager like Google Drive built with Express, TypeScript, Prisma, PostgreSQL, and Cloudinary.

## Features

- User registration and login
- Create folders and subfolders
- Upload files
- View file details
- Download files
- File validation for type and size

## Tech stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Passport
- EJS
- Cloudinary

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the env file:

```bash
cp .env.example .env
```

3. Update `.env` with your database and Cloudinary credentials.

4. Run the migrations and generate the Prisma client:

```bash
npm exec prisma migrate deploy
npm run prisma:generate
```

5. Start the app:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment variables

- `DATABASE_URL`
- `SESSION_SECRET`
- `PORT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
