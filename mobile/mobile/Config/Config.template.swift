import Foundation

enum Environment {
    case development
    case production
    
    var baseURL: String {
        switch self {
        case .development:
            return "http://localhost:3000" // Replace with your development API URL
        case .production:
            return "https://your-production-url.com" // Replace with your production API URL
        }
    }
}

struct Config {
    static let environment: Environment = .development
    static let baseURL = environment.baseURL
    static let bypassToken = "YOUR_BYPASS_TOKEN" // Replace with your bypass token
    
    struct API {
        static let prefix = "/api"
        static let version = "1"
        static let headers: [String: String] = [
            "Accept-Version": version,
            "x-bypass-token": bypassToken,
            "Content-Type": "application/json"
        ]
    }
} 