# Mobile App

iOS mobile application for the auth system.

## Setup

1. Clone the repository
2. Set up the configuration:
   ```bash
   cd mobile/mobile/Config
   cp Config.template.swift Config.swift
   ```
3. Edit `Config.swift` with your actual values:
   - Set the appropriate API URLs for development and production
   - Add your bypass token
   - Update any other configuration values as needed
4. Open `mobile.xcodeproj` in Xcode
5. Build and run the project

## Development

The app is built using:
- SwiftUI for the UI
- Async/await for network calls
- iOS 15+ as the deployment target

### Configuration

The app uses a configuration file that is not committed to the repository for security reasons. The template file `Config.template.swift` shows the required structure, but you'll need to create your own `Config.swift` with actual values.

Required configuration:
- API URLs for development and production environments
- Bypass token for authentication
- API version number

### Architecture

The app follows a standard SwiftUI architecture with:
- Views in the Features directory
- Services for API calls
- Models for data structures
- Configuration handling in Config directory 