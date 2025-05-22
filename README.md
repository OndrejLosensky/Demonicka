# 🍺 Démonická

<div align="center">

![Démonická Banner](docs/assets/banner.png)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-ea2845.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Swift](https://img.shields.io/badge/Swift-5.9-orange.svg)](https://swift.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-003b57.svg)](https://www.sqlite.org/)

A modern, full-stack event management system for tracking consumption, managing participants, and monitoring inventory at the annual Démonická gathering.

[Getting Started](#getting-started) •
[Features](#features) •
[Documentation](#documentation) •
[Roadmap](#roadmap) •
[Contributing](#contributing)

</div>

## 🚀 Features

### Web Admin Interface
- 📊 Real-time dashboard with consumption statistics
- 👥 Participant management and tracking
- 🛢️ Inventory management
- 📈 Leaderboard with gender categories
- 📱 Responsive design for all devices

### iOS Admin App (Coming Soon)
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

- [API Documentation](docs/API.md)
- [Security Enhancements](docs/security_enhancements.md)
- [Future Updates](docs/future_updates.md)
- [iOS Admin App](docs/admin-swift.md)
- [Backend Mobile Updates](docs/backend-mobile-updates.md)

## 🗺️ Project Structure

```
demonicka/
├── server/             # NestJS backend
│   ├── src/
│   │   ├── auth/       # Authentication
│   │   └── participants/  # Participants 
│   │   ├── beers/      # Consumption tracking
│   │   ├── barrels/    # Barrel management
│   │   └── dashboard/  # Statistics & analytics
|   |   └── users       # User management 
│   └── test/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
└── ios/               # Swift admin app (coming soon)
```

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [Material-UI](https://mui.com/) - UI components
- [Swift](https://swift.org) - iOS development
- [SQLite](https://www.sqlite.org/) - Database

## 📬 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/demonicka](https://github.com/yourusername/demonicka)

---

<div align="center">

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div> 