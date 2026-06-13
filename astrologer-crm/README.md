# Astrologer CRM

A simple astrologer CRM application with clients and appointment management.

## Setup

1. Open a terminal in the `astrologer-crm` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make sure MongoDB is running and the connection string in `.env` is correct.

## Run

```bash
npm start
```

Then open `http://localhost:5000` in your browser.

## Project Structure

- `server.js` - Express backend with MongoDB models and API routes
- `public/index.html` - Front-end UI
- `public/app.js` - Front-end logic for CRUD and dashboard
- `public/style.css` - App styles
- `.env` - Environment variables
- `package.json` - Dependencies and scripts
