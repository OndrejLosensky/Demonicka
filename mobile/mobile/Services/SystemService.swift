import Foundation

struct RegisterTokenResponse: Codable {
    let token: String
}

class SystemService {
    static let shared = SystemService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func cleanup() async throws {
        try await apiClient.requestWithoutResponse("users/cleanup", method: .post)
    }
    
    func getSystemStats() async throws -> SystemStats {
        try await apiClient.fetch("dashboard/system")
    }
    
    func generateRegisterToken(userId: String) async throws -> String {
        let response: RegisterTokenResponse = try await apiClient.fetch("users/\(userId)/register-token", method: .post)
        return response.token
    }
} 