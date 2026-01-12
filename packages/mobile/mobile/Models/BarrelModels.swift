import Foundation

struct CreateBarrel: Codable {
    let size: Int
    let orderNumber: Int
}

struct Barrel: Codable, Identifiable {
    let id: String
    let size: Int
    let orderNumber: Int
    let totalBeers: Int
    let remainingBeers: Int
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
    
    var remainingPercentage: Double {
        return Double(remainingBeers) / Double(totalBeers) * 100.0
    }
} 