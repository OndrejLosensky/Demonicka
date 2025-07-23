import Foundation

struct AuthResponse: Codable {
    let access_token: String
    let user: User
}

struct User: Codable {
    let id: String
    let username: String
    let role: String
    let isAdminLoginEnabled: Bool
    let firstName: String?
    let lastName: String?
    let gender: String
    let beerCount: Int
    let lastBeerTime: Date?
    let registrationToken: String?
    let isRegistrationComplete: Bool
    let isTwoFactorEnabled: Bool
    let twoFactorSecret: String?
    let allowedIPs: String?
    let lastAdminLogin: Date?
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
}

class AuthService {
    private let baseURL = "http://localhost:3000/api"
    private let dateFormatter: DateFormatter
    
    init() {
        // Initialize date formatter for the specific format from backend
        dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        dateFormatter.timeZone = TimeZone(abbreviation: "UTC")
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
    }
    
    func login(username: String, password: String) async throws -> AuthResponse {
        print("AuthService: Creating login request...")
        guard let url = URL(string: "\(baseURL)/auth/login") else {
            print("AuthService: Invalid URL")
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("*", forHTTPHeaderField: "Accept")
        
        // Set CORS headers to match backend configuration
        request.setValue("true", forHTTPHeaderField: "withCredentials")
        request.setValue("http://localhost:5173", forHTTPHeaderField: "Origin")
        
        let body = ["username": username, "password": password]
        request.httpBody = try? JSONEncoder().encode(body)
        
        print("AuthService: Sending request...")
        
        // Create URLSession with proper configuration
        let config = URLSessionConfiguration.default
        config.httpShouldSetCookies = true
        config.httpCookieAcceptPolicy = .always
        let session = URLSession(configuration: config)
        
        let (data, httpResponse) = try await session.data(for: request)
        
        guard let httpResponse = httpResponse as? HTTPURLResponse else {
            print("AuthService: Invalid response type")
            throw URLError(.badServerResponse)
        }
        
        print("AuthService: Response status code: \(httpResponse.statusCode)")
        if let responseString = String(data: data, encoding: .utf8) {
            print("AuthService: Response data: \(responseString)")
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            print("AuthService: Request failed with status code \(httpResponse.statusCode)")
            throw URLError(.badServerResponse)
        }
        
        print("AuthService: Decoding response...")
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try parsing with our date formatter
            if let date = self.dateFormatter.date(from: dateString) {
                return date
            }
            
            // If that fails, try without milliseconds
            let fallbackFormatter = DateFormatter()
            fallbackFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
            fallbackFormatter.timeZone = TimeZone(abbreviation: "UTC")
            fallbackFormatter.locale = Locale(identifier: "en_US_POSIX")
            
            if let date = fallbackFormatter.date(from: dateString) {
                return date
            }
            
            print("Failed to parse date string: \(dateString)")
            throw DecodingError.dataCorrupted(
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Date string does not match expected format: \(dateString)",
                    underlyingError: nil
                )
            )
        }
        
        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        print("AuthService: Successfully decoded response")
        return authResponse
    }
} 