import Foundation

class DashboardService {
    static let shared = DashboardService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func fetchDashboardData() async throws -> DashboardData {
        // First get the active event
        let event: Event = try await apiClient.fetch("events/active")
        print("🎯 Fetching dashboard data for event: \(event.id)")
        
        // Properly encode the eventId parameter
        guard let encodedEventId = event.id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            throw APIError.invalidURL
        }
        
        // Use the public endpoint which is accessible with bypass token
        let publicData: PublicDashboardData = try await apiClient.fetch("dashboard/public?eventId=\(encodedEventId)")
        
        // Convert PublicDashboardData to DashboardData
        return convertPublicDataToDashboardData(publicData)
    }
    
    private func convertPublicDataToDashboardData(_ publicData: PublicDashboardData) -> DashboardData {
        // Calculate average beers per user
        let averageBeersPerUser = publicData.totalUsers > 0 ? Double(publicData.totalBeers) / Double(publicData.totalUsers) : 0.0
        
        // Convert top users to include id field (generate a placeholder id)
        let topUsers = publicData.topUsers.enumerated().map { index, user in
            UserStats(id: "user_\(index)", username: user.username, beerCount: user.beerCount)
        }
        
        return DashboardData(
            totalBeers: publicData.totalBeers,
            totalUsers: publicData.totalUsers,
            totalBarrels: publicData.totalBarrels,
            averageBeersPerUser: averageBeersPerUser,
            topUsers: topUsers,
            barrelStats: publicData.barrelStats
        )
    }
}

// Helper model for active event
private struct Event: Codable {
    let id: String
    let name: String
    
    // For debugging
    func description() -> String {
        return "Event(id: \(id), name: \(name))"
    }
} 
