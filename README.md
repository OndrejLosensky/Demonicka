# 🍺 Démonická BMS (Beer Management System)

<div align="center">

<!-- Add your banner here -->
<!-- ![Démonická BMS Banner](docs/assets/banner.png) -->

<!-- Add your badges here -->
[![wakatime](https://wakatime.com/badge/user/018dd279-af88-40d4-86db-db3b3100ed1e/project/721ad3f8-d413-4a1a-b09b-010a5b6f036d.svg)](https://wakatime.com/badge/user/018dd279-af88-40d4-86db-db3b3100ed1e/project/721ad3f8-d413-4a1a-b09b-010a5b6f036d)

A modern, full-stack beer management system for tracking consumption, managing participants, and monitoring inventory at the annual Démonická gathering.

[Features](#-features) •
[Documentation](#-documentation) •
[Project Structure](#️-project-structure)

</div>

## 🚀 Features

### Web Admin Interface
- 📊 Real-time dashboard with consumption statistics
- 👥 Participant management and tracking
- 🛢️ Inventory and barrel management
- 📈 Leaderboard with gender categories
- 📱 Responsive design for all devices

### iOS Admin App
- 📲 Native iOS experience
- 🔐 Biometric authentication
- 🔄 Offline support
- 🎯 Quick actions and widgets
- 📸 QR code scanning

### Backend
- 🔒 Secure JWT authentication
- 🚦 Rate limiting and request validation
- 📡 Real-time updates
- 🔄 Refresh token rotation
- 📦 SQLite database

## 📚 Documentation

- [API Documentation](server/docs/api/API.md)
- [Getting Started](server/docs/getting-started/)
- [User Guide](server/docs/user-guide/)

## 🗺️ Project Structure

```
auth/
├── server/             # NestJS backend
│   ├── src/
│   │   ├── auth/       # Authentication
│   │   ├── participants/  # Participants 
│   │   ├── beers/      # Consumption tracking
│   │   ├── barrels/    # Barrel management
│   │   └── dashboard/  # Statistics & analytics
│   │   └── users       # User management 
│   └── docs/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
└── mobile/             # Swift admin app
```

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [Swift](https://swift.org) - iOS development
- [SQLite](https://www.sqlite.org/) - Database

---

<div align="center">

Made with ❤️ for the Démonická

</div> 