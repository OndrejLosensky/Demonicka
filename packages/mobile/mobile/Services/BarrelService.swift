import Foundation

class BarrelService {
    static let shared = BarrelService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func fetchBarrels() async throws -> [Barrel] {
        // First get the active event
        let event: EventModel = try await apiClient.fetch("events/active")
        // Then get the barrels for that event
        return try await apiClient.fetch("events/\(event.id)/barrels")
    }
    
    func createBarrel(_ barrel: CreateBarrel) async throws {
        print("🚀 Creating barrel: \(barrel)")
        
        do {
            // First create the barrel
            let newBarrel: Barrel = try await apiClient.fetch(
                "barrels",
                method: .post,
                body: barrel
            )
            
            // Then get the active event and add the barrel to it
            let event: EventModel = try await apiClient.fetch("events/active")
            try await apiClient.requestWithoutResponse(
                "events/\(event.id)/barrels/\(newBarrel.id)",
                method: .put
            )
            
            // Automatically activate the new barrel (like frontend does)
            try await activateBarrel(id: newBarrel.id)
            
            print("✅ Successfully created and activated barrel")
        } catch {
            print("❌ Failed to create barrel: \(error)")
            throw error
        }
    }
    
    func activateBarrel(id: String) async throws {
        try await apiClient.requestWithoutResponse("barrels/\(id)/activate", method: .patch)
    }
} 