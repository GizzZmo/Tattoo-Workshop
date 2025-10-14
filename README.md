# Tattoo Workshop 🎨

A comprehensive studio management suite for tattoo artists and studios, featuring AI-powered design generation, customer management, appointment scheduling, and more.

## Features ✨

- **🤖 AI Tattoo Generator**: Generate detailed tattoo design descriptions using Google Gemini AI
- **👥 Customer Management**: Secure customer database with contact information and notes
- **📅 Appointment Scheduling**: Track appointments with customers, artists, and status updates
- **💰 Dynamic Pricelist**: Manage services with categories, pricing, and duration estimates
- **🖼️ Portfolio Gallery**: Showcase your work with images, descriptions, and tags
- **⚙️ Settings Management**: Configure API keys and application preferences
- **🔒 Secure Local Storage**: All data stored locally using SQLite database

## Tech Stack 🛠️

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **AI Integration**: Google Gemini API
- **Styling**: Custom CSS with responsive design
- **Routing**: React Router v6

## Installation 📦

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/GizzZmo/Tattoo-Workshop.git
   cd Tattoo-Workshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 3001) and frontend dev server (port 3000).

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The backend API runs on `http://localhost:3001`

## Configuration ⚙️

### Gemini API Key

To use the AI Tattoo Generator feature:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. In the application, navigate to **Settings**
5. Enter your API key and save

## Usage Guide 📖

### Dashboard
The dashboard provides an overview of your studio statistics and quick access to all features.

### Customer Management
- Add, edit, and delete customer records
- Store contact information, addresses, and custom notes
- Search and filter customers

### Appointments
- Schedule appointments with specific customers
- Assign artists to appointments
- Set duration and add notes
- Track appointment status (scheduled, completed, cancelled)

### Pricelist
- Create service categories
- Add services with pricing and estimated duration
- Edit and organize your offerings

### Portfolio
- Add images of your work
- Include descriptions and artist information
- Tag pieces with relevant keywords
- Organize and showcase your best work

### AI Tattoo Generator
- Enter detailed descriptions of tattoo ideas
- Receive professional design recommendations
- Get style suggestions and placement advice
- View generation history

## Development 💻

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Start only the frontend dev server
- `npm run dev:server` - Start only the backend server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

### Project Structure

```
Tattoo-Workshop/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions workflow
├── public/
│   └── tattoo-icon.svg        # Application icon
├── server/
│   └── index.js               # Express server and API routes
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── Customers.jsx      # Customer management
│   │   ├── Appointments.jsx   # Appointment scheduling
│   │   ├── Pricelist.jsx      # Service pricing
│   │   ├── Portfolio.jsx      # Portfolio gallery
│   │   ├── TattooGenerator.jsx # AI generator
│   │   └── Settings.jsx       # Settings page
│   ├── styles/
│   │   └── App.css           # Global styles
│   ├── App.jsx               # Main app component
│   └── main.jsx              # Entry point
├── .eslintrc.cjs             # ESLint configuration
├── .gitignore                # Git ignore rules
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
└── README.md                 # This file
```

## GitHub Actions Workflow 🔄

The project includes a CI/CD pipeline that:

- ✅ Runs on push to main/develop branches and pull requests
- ✅ Tests against multiple Node.js versions (18.x, 20.x)
- ✅ Installs dependencies and runs linting
- ✅ Builds the application
- ✅ Uploads build artifacts
- ✅ Deploys to GitHub Pages on main branch

## Security & Privacy 🔒

- All customer data is stored locally in a SQLite database
- API keys are stored securely and only used for AI requests
- No data is shared with third parties except Google AI for design generation
- Regular database backups are recommended

## Contributing 🤝

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is open source and available under the MIT License.

## Support 💬

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

## Roadmap 🗺️

Future enhancements planned:
- [ ] User authentication and multi-user support
- [ ] Email notifications for appointments
- [ ] Invoice generation
- [ ] Cloud backup integration
- [ ] Mobile app version
- [ ] Advanced reporting and analytics
- [ ] Integration with payment processors
- [ ] Booking widget for website integration

## Acknowledgments 🙏

- Google Gemini AI for powering the design generator
- React and Vite communities
- All contributors and users

---

Built with ❤️ for tattoo artists and studios
