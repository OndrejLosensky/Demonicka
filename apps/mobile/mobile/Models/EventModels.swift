import Foundation

struct EventModel: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let startDate: Date
    let endDate: Date?
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
    
    var formattedDateRange: String {
        let startFormatted = startDate.formatted(date: .abbreviated, time: .omitted)
        if let endDate = endDate {
            let endFormatted = endDate.formatted(date: .abbreviated, time: .omitted)
            return "\(startFormatted) - \(endFormatted)"
        }
        return "From \(startFormatted)"
    }
} 