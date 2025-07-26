import Foundation

class SystemService {
    static let shared = SystemService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func cleanup() async throws {
        try await apiClient.requestWithoutResponse("users/cleanup", method: .post)
    }
} 