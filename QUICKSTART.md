# Quick Start Guide

Get up and running with Tattoo Workshop in minutes!

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/GizzZmo/Tattoo-Workshop.git
cd Tattoo-Workshop

# Install dependencies
npm install
```

## 🎯 First Run

```bash
# Start the application
npm run dev
```

Open your browser and go to: **http://localhost:3000**

## 📝 Add Sample Data (Optional)

Want to see the app with sample data? Run:

```bash
npm run seed
```

This will add:
- 4 sample customers
- 8 services to the pricelist
- 4 appointments
- 5 portfolio items
- 2 AI-generated tattoo examples

## ⚡ Quick Setup

### 1. Configure Gemini API (for AI Features)

1. Click **Settings** in the navigation
2. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Enter the key and click **Save**

### 2. Add Your First Service

1. Go to **Pricelist**
2. Click **+ Add Service**
3. Fill in the details and save

### 3. Register a Customer

1. Go to **Customers**
2. Click **+ Add Customer**
3. Enter customer information

### 4. Try the AI Generator

1. Go to **AI Generator**
2. Describe a tattoo idea
3. Click **Generate Design Description**

## 📱 Navigation

- **Dashboard** - Overview and statistics
- **Customers** - Manage customer database
- **Appointments** - Schedule and track appointments
- **Pricelist** - Manage services and pricing
- **Portfolio** - Showcase your work
- **AI Generator** - Generate tattoo design ideas
- **Settings** - Configure API keys

## 🎨 Features to Try

1. **Customer Management**
   - Add a new customer
   - Edit customer details
   - Add notes about preferences

2. **Appointment Scheduling**
   - Schedule an appointment with a customer
   - Set artist, date, and duration
   - Update appointment status

3. **Pricelist**
   - Organize services by category
   - Set pricing and duration
   - Easy editing and updates

4. **Portfolio**
   - Add images of your work
   - Tag pieces for easy searching
   - Showcase different styles

5. **AI Tattoo Generator**
   - Describe design ideas
   - Get professional recommendations
   - Save generation history

## 💡 Tips

- **Navigation**: Use the top menu to switch between sections
- **Forms**: Required fields are marked with *
- **Editing**: Click "Edit" to modify existing entries
- **Deleting**: Confirmation is required before deletion
- **Mobile**: The app is fully responsive

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed information
- Review [INSTALLATION.md](INSTALLATION.md) for troubleshooting
- See [API.md](API.md) for API documentation
- Read [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## 🔄 Common Tasks

### Reset Database
```bash
# Stop the server, then:
rm server/tattoo-workshop.db
# Restart the server to create fresh database
```

### Backup Database
```bash
cp server/tattoo-workshop.db backups/tattoo-workshop-$(date +%Y%m%d).db
```

### Update Dependencies
```bash
npm update
```

## 📊 What's Next?

After getting familiar with the basics:

1. Customize the pricelist for your studio
2. Import your existing customer data
3. Add your portfolio pieces
4. Configure the AI generator with your API key
5. Start scheduling appointments!

## 🎯 Pro Tips

- Use categories in the pricelist to organize services
- Add detailed notes to customer profiles
- Tag portfolio pieces for easy filtering
- Be specific in AI prompts for better results
- Regular database backups are recommended

---

Enjoy using Tattoo Workshop! 🎨✨
