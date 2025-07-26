import Foundation

struct SystemUser: Codable, Identifiable {
    let id: String
    let username: String
    let role: String
    let isRegistrationComplete: Bool
    let isTwoFactorEnabled: Bool
    let isAdminLoginEnabled: Bool
    let lastAdminLogin: String?
}

struct SystemStats: Codable {
    let users: [SystemUser]
    let totalUsers: Int
    let totalAdminUsers: Int
    let totalCompletedRegistrations: Int
    let total2FAEnabled: Int
} 