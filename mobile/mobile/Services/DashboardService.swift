import Foundation

class DashboardService {
    static let shared = DashboardService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func fetchDashboardData() async throws -> DashboardData {
        return try await apiClient.fetch("dashboard/overview")
    }
} 
