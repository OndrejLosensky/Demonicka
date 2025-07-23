import Foundation

class BarrelsService: ObservableObject {
    static let shared = BarrelsService()
    
    @Published var barrels: [Barrel] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    func loadBarrels() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            Config.printDebug("Loading barrels...")
            
            let response: PaginatedResponse<Barrel> = try await apiClient.get(
                endpoint: "/barrels",
                responseType: PaginatedResponse<Barrel>.self
            )
            
            await MainActor.run {
                self.barrels = response.data.filter { $0.deletedAt == nil }
                self.isLoading = false
            }
            
            Config.printDebug("Loaded \(response.data.count) barrels")
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load barrels: \(error.localizedDescription)"
                self.isLoading = false
            }
            Config.printDebug("Failed to load barrels: \(error)")
        }
    }
    
    func createBarrel(
        name: String,
        beerType: String?,
        volume: Double,
        remaining: Double? = nil,
        orderNumber: Int? = nil
    ) async throws -> Barrel {
        Config.printDebug("Creating barrel: \(name)")
        
        let request = CreateBarrelRequest(
            name: name,
            beerType: beerType,
            volume: volume,
            remaining: remaining ?? volume,
            orderNumber: orderNumber
        )
        
        let newBarrel: Barrel = try await apiClient.post(
            endpoint: "/barrels",
            body: request,
            responseType: Barrel.self
        )
        
        await MainActor.run {
            self.barrels.append(newBarrel)
        }
        
        Config.printDebug("Created barrel: \(newBarrel.displayName)")
        return newBarrel
    }
    
    func activateBarrel(_ barrelId: String) async throws {
        Config.printDebug("Activating barrel: \(barrelId)")
        
        let updatedBarrel: Barrel = try await apiClient.patch(
            endpoint: "/barrels/\(barrelId)/activate",
            body: EmptyResponse(),
            responseType: Barrel.self
        )
        
        await MainActor.run {
            if let index = barrels.firstIndex(where: { $0.id == barrelId }) {
                barrels[index] = updatedBarrel
            }
        }
        
        Config.printDebug("Activated barrel: \(updatedBarrel.displayName)")
    }
    
    func deactivateBarrel(_ barrelId: String) async throws {
        Config.printDebug("Deactivating barrel: \(barrelId)")
        
        // Create an updated barrel model with isActive = false
        let updateRequest = UpdateBarrelRequest(isActive: false)
        let updatedBarrel: Barrel = try await apiClient.patch(
            endpoint: "/barrels/\(barrelId)",
            body: updateRequest,
            responseType: Barrel.self
        )
        
        await MainActor.run {
            if let index = barrels.firstIndex(where: { $0.id == barrelId }) {
                barrels[index] = updatedBarrel
            }
        }
        
        Config.printDebug("Deactivated barrel: \(updatedBarrel.displayName)")
    }
    
    func updateBarrel(
        _ barrelId: String,
        name: String? = nil,
        beerType: String? = nil,
        volume: Double? = nil,
        remaining: Double? = nil,
        orderNumber: Int? = nil
    ) async throws -> Barrel {
        Config.printDebug("Updating barrel: \(barrelId)")
        
        let updateRequest = UpdateBarrelRequest(
            name: name,
            beerType: beerType,
            volume: volume,
            remaining: remaining,
            orderNumber: orderNumber
        )
        
        let updatedBarrel: Barrel = try await apiClient.patch(
            endpoint: "/barrels/\(barrelId)",
            body: updateRequest,
            responseType: Barrel.self
        )
        
        await MainActor.run {
            if let index = barrels.firstIndex(where: { $0.id == barrelId }) {
                barrels[index] = updatedBarrel
            }
        }
        
        Config.printDebug("Updated barrel: \(updatedBarrel.displayName)")
        return updatedBarrel
    }
    
    func deleteBarrel(_ barrelId: String) async throws {
        Config.printDebug("Deleting barrel: \(barrelId)")
        
        try await apiClient.delete(endpoint: "/barrels/\(barrelId)")
        
        await MainActor.run {
            barrels.removeAll { $0.id == barrelId }
        }
        
        Config.printDebug("Deleted barrel: \(barrelId)")
    }
    
    // MARK: - Utility Methods
    
    func getBarrelById(_ id: String) -> Barrel? {
        return barrels.first { $0.id == id }
    }
    
    func getActiveBarrels() -> [Barrel] {
        return barrels.filter { $0.isActive }
    }
    
    func getEmptyBarrels() -> [Barrel] {
        return barrels.filter { $0.remaining <= 0 }
    }
    
    func getStandbyBarrels() -> [Barrel] {
        return barrels.filter { !$0.isActive && $0.remaining > 0 }
    }
    
    func getTotalVolume() -> Double {
        return barrels.reduce(0) { $0 + $1.volume }
    }
    
    func getTotalRemaining() -> Double {
        return barrels.reduce(0) { $0 + $1.remaining }
    }
    
    func getTotalRemainingBeers() -> Int {
        return barrels.reduce(0) { $0 + $1.remainingBeers }
    }
    
    func getAverageFillLevel() -> Double {
        guard !barrels.isEmpty else { return 0 }
        let totalFill = barrels.reduce(0) { $0 + $1.fillPercentage }
        return totalFill / Double(barrels.count)
    }
    
    func needsRefill(threshold: Double = 0.2) -> [Barrel] {
        return barrels.filter { $0.fillPercentage <= threshold && $0.isActive }
    }
    
    func getBarrelsByStatus(_ status: BarrelStatus) -> [Barrel] {
        return barrels.filter { $0.status == status }
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Statistics
    
    func getBarrelStats() -> (total: Int, active: Int, empty: Int, standby: Int) {
        let total = barrels.count
        let active = getActiveBarrels().count
        let empty = getEmptyBarrels().count
        let standby = getStandbyBarrels().count
        
        return (total: total, active: active, empty: empty, standby: standby)
    }
} 