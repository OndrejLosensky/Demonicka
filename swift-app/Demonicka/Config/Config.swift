import Foundation

struct Config {
    // MARK: - API Configuration
    static let baseURL = "http://localhost:3000/api"
    static let apiVersion = "1"
    
    // MARK: - Admin Credentials (Local only)
    static let adminUsername = "admin"
    static let adminPassword = "admin_password"
    
    // MARK: - Device Info
    static let deviceType = "ios"
    
    // MARK: - Timeouts
    static let requestTimeout: TimeInterval = 30.0
    static let refreshTokenThreshold: TimeInterval = 60.0 // Refresh if expires in 1 minute
    
    // MARK: - UI Constants
    static let cardCornerRadius: CGFloat = 12.0
    static let cardShadowRadius: CGFloat = 3.0
    static let defaultSpacing: CGFloat = 16.0
    static let compactSpacing: CGFloat = 8.0
}

// MARK: - Environment Detection
extension Config {
    static var isDebug: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
    
    static func printDebug(_ message: String) {
        if isDebug {
            print("[DEBUG] \(message)")
        }
    }
} 