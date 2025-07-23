import Foundation
import SwiftUI

// MARK: - Core Models

struct User: Codable, Identifiable {
    let id: String
    let username: String
    let name: String?
    let firstName: String?
    let lastName: String?
    let gender: String
    let role: String
    let beerCount: Int
    let lastBeerTime: String?
    let isRegistrationComplete: Bool
    let createdAt: String
    let updatedAt: String
    let deletedAt: String?
    
    var isActive: Bool {
        deletedAt == nil
    }
    
    var displayName: String {
        if let firstName = firstName, let lastName = lastName {
            return "\(firstName) \(lastName)"
        }
        return name ?? username
    }
}

struct Event: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let startDate: String
    let endDate: String?
    let isActive: Bool
    let createdAt: String
    let updatedAt: String
    let deletedAt: String?
    
    var formattedDateRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        
        guard let start = formatter.date(from: startDate) else {
            return "Invalid date"
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        displayFormatter.timeStyle = .short
        
        if let endDateString = endDate,
           let end = formatter.date(from: endDateString) {
            return "\(displayFormatter.string(from: start)) - \(displayFormatter.string(from: end))"
        } else {
            return "From \(displayFormatter.string(from: start))"
        }
    }
}

struct Barrel: Codable, Identifiable {
    let id: String
    let name: String
    let beerType: String?
    let volume: Double
    let remaining: Double
    let remainingBeers: Int
    let orderNumber: Int?
    let isActive: Bool
    let createdAt: String
    let updatedAt: String
    let deletedAt: String?
    
    var fillPercentage: Double {
        volume > 0 ? remaining / volume : 0
    }
    
    var status: BarrelStatus {
        if remaining <= 0 {
            return .empty
        } else if isActive {
            return .active
        } else {
            return .standby
        }
    }
    
    var displayName: String {
        if let orderNumber = orderNumber {
            return "Sud #\(orderNumber) - \(name)"
        }
        return name
    }
}

enum BarrelStatus {
    case active, empty, standby
    
    var color: Color {
        switch self {
        case .active: return .green
        case .empty: return .red
        case .standby: return .orange
        }
    }
    
    var text: String {
        switch self {
        case .active: return "ACTIVE"
        case .empty: return "EMPTY"
        case .standby: return "STANDBY"
        }
    }
}

// MARK: - API Request Models

struct AdminLoginRequest: Codable {
    let username: String
    let password: String
    let deviceToken: String
    let deviceType: String
    let deviceName: String
    let deviceModel: String?
    let osVersion: String?
}

struct CreateParticipantRequest: Codable {
    let name: String
    let gender: String // "MALE" or "FEMALE"
}

struct CreateEventRequest: Codable {
    let name: String
    let description: String?
    let startDate: String
    let endDate: String?
}

struct CreateBarrelRequest: Codable {
    let name: String
    let beerType: String?
    let volume: Double
    let remaining: Double?
    let orderNumber: Int?
}

struct UpdateBarrelRequest: Codable {
    let name: String?
    let beerType: String?
    let volume: Double?
    let remaining: Double?
    let orderNumber: Int?
    let isActive: Bool?
    
    init(name: String? = nil, beerType: String? = nil, volume: Double? = nil, remaining: Double? = nil, orderNumber: Int? = nil, isActive: Bool? = nil) {
        self.name = name
        self.beerType = beerType
        self.volume = volume
        self.remaining = remaining
        self.orderNumber = orderNumber
        self.isActive = isActive
    }
}

// MARK: - API Response Models

struct AdminLoginResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }
}

struct PaginatedResponse<T: Codable>: Codable {
    let data: [T]
    let total: Int?
    let page: Int?
    let limit: Int?
}

struct ApiErrorResponse: Codable {
    let message: String
    let error: String?
    let statusCode: Int?
}

// MARK: - Empty Response for endpoints that return nothing
struct EmptyResponse: Codable {
    // Empty struct for void API calls
}

// MARK: - Dashboard Stats Model
struct DashboardStats: Codable {
    let totalBeers: Int
    let totalUsers: Int
    let totalBarrels: Int
    let activeBarrels: Int
    let lastBeerTime: String?
    let topUser: User?
    
    // Computed properties for display
    var hasActivity: Bool {
        totalBeers > 0 || totalUsers > 0
    }
} 