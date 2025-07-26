import Foundation

class BarrelService {
    static let shared = BarrelService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func fetchBarrels() async throws -> [Barrel] {
        print("🔍 Fetching active event...")
        let event: Event = try await apiClient.fetch("events/active")
        print("📅 Got active event: \(event.id)")
        
        print("🛢️ Fetching barrels for event: \(event.id)")
        let barrels = try await apiClient.fetch("events/\(event.id)/barrels") as [Barrel]
        print("📊 Received \(barrels.count) barrels:")
        barrels.forEach { barrel in
            print("""
                  🍺 Barrel:
                     ID: \(barrel.id)
                     Size: \(barrel.size)L
                     Remaining Beers: \(barrel.remainingBeers)
                     Total Beers: \(barrel.totalBeers)
                     Active: \(barrel.isActive)
                  """)
        }
        return barrels
    }
    
    func addBarrel(size: Int) async throws {
        // First get the active event
        let event: Event = try await apiClient.fetch("events/active")
        
        // Create the barrel
        let barrel = try await apiClient.fetch(
            "events/\(event.id)/barrels/\(size)",
            method: .post
        ) as Barrel
        
        print("✅ Added new barrel: Size \(barrel.size)L")
    }
}

// Helper model for active event
private struct Event: Codable {
    let id: String
} 