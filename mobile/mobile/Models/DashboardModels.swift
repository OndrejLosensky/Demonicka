import Foundation

struct UserStats: Codable {
    let id: String
    let username: String
    let beerCount: Int
}

struct BarrelStats: Codable {
    let size: Int
    let count: Int
}

struct DashboardData: Codable {
    let totalBeers: Int
    let totalUsers: Int
    let totalBarrels: Int
    let averageBeersPerUser: Double
    let topUsers: [UserStats]
    let barrelStats: [BarrelStats]
}

// Model for the public dashboard endpoint
struct PublicDashboardData: Codable {
    let totalBeers: Int
    let totalUsers: Int
    let totalBarrels: Int
    let topUsers: [PublicUserStats]
    let barrelStats: [BarrelStats]
}

// Public user stats without id field
struct PublicUserStats: Codable {
    let username: String
    let beerCount: Int
} 