# Installation Guide

## Prerequisites

Before installing Tattoo Workshop, make sure you have:

- **Node.js** version 18.x or higher
- **npm** (comes with Node.js) or **yarn**
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/GizzZmo/Tattoo-Workshop.git
cd Tattoo-Workshop
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies for both the frontend and backend.

### 3. Start the Application

```bash
npm run dev
```

This command starts both:
- **Backend Server**: http://localhost:3001
- **Frontend Dev Server**: http://localhost:3000

### 4. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

## Configuration

### Setting up Gemini API Key

1. Navigate to Settings in the application
2. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Create a new API key
4. Enter the API key in the Settings page
5. Click "Save API Key"

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use, you can:

1. Stop the process using that port
2. Or modify the ports in:
   - `vite.config.js` (frontend port)
   - `server/index.js` (backend port)

### Dependencies Installation Failed

Try clearing npm cache:

```bash
npm cache clean --force
npm install
```

### Build Errors

Make sure you're using Node.js version 18.x or higher:

```bash
node --version
```

## Database

The application uses SQLite for local data storage. The database file (`tattoo-workshop.db`) is automatically created in the `server/` directory on first run.

### Backup Your Data

To backup your data, simply copy the database file:

```bash
cp server/tattoo-workshop.db server/tattoo-workshop.backup.db
```

### Reset Database

To reset the database, stop the server and delete the database file:

```bash
rm server/tattoo-workshop.db
```

The database will be recreated with empty tables on next server start.

## Running in Production

For production deployment, consider:

1. Using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name tattoo-workshop
   ```

2. Setting up a reverse proxy with nginx or Apache

3. Enabling HTTPS for secure communication

4. Regular database backups

## System Requirements

### Minimum Requirements
- 2 GB RAM
- 1 GB disk space
- Modern web browser

### Recommended
- 4 GB RAM
- 5 GB disk space (for database and images)
- Chrome or Firefox browser (latest version)

## Support

For issues or questions:
- Check the [README.md](README.md) for general information
- Open an issue on GitHub
- Review the server logs for error messages
