# Medical Inventory Management System

A full-stack medical inventory management project built with React, Node.js, Express, and MongoDB.

## Features

- User registration and login
- Role-based admin and clinic-user views
- Medicine inventory management
- Stock-level and expiry tracking
- User administration
- Activity logging

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js and Express
- **Database:** MongoDB with Mongoose
- **HTTP:** REST API

## Prerequisites

- Node.js (LTS recommended) and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Manankhokhariya/Medical-Inventory-minor-project.git
   cd Medical-Inventory-minor-project
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file from the example:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and set `MONGODB_URI` to your own MongoDB connection string. Do not commit `.env`.
5. Start MongoDB, then run the application:
   ```bash
   npm start
   ```

The React development server uses port `3000` and the Express API uses port `5000` by default.

## Available Scripts

- `npm start` — run the backend and frontend together
- `npm run client` — run the React frontend only
- `npm run server` — run the Express backend only
- `npm run build` — create a production frontend build
- `npm test` — run the test suite

## Environment Variables

See [`.env.example`](.env.example) for the supported local configuration variables.

## Security Notes

- Never commit `.env` or real database connection strings.
- `server/data/db.json` is a local seed-data file and is intentionally excluded because it may contain user records and plaintext sample passwords.
- The current project code includes demo password handling; do not deploy it with real user data until password hashing and appropriate authentication/session protections have been implemented.

## License

No license has been specified for this project.
