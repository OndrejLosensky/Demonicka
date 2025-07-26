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
        
        // Then get the dashboard data for that specific event
        return try await apiClient.fetch("dashboard/overview?eventId=\(encodedEventId)")
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
