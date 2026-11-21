# Medical Inventory Management System

A college minor project built with React and Node.js/Express, with MongoDB integration.

## Project structure

- `src/` — React frontend, pages, components, and authentication context
- `server/` — Express backend, database setup, models, and API routes
- `public/` — static frontend assets

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and configure your local environment variables.
3. Start the development server using the scripts in `package.json`.

## Security note

This repository intentionally excludes local database records and environment secrets. The current authentication implementation is for learning/demo use and should be reviewed (including password hashing and secure session handling) before real-world deployment.
