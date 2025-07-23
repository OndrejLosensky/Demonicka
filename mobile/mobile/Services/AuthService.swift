import Foundation

enum AuthError: Error {
    case invalidCredentials
    case networkError
    case decodingError
    case serverError(String)
    case refreshTokenMissing
}

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
}

class AuthService {
    private let baseURL = "http://localhost:3000/api"
    private let session: URLSession
    
    init() {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        config.httpCookieStorage = .shared
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }
    
    func login(username: String, password: String) async throws -> AuthResponse {
        guard let url = URL(string: "\(baseURL)/auth/login") else {
            throw AuthError.networkError
        }
        
        let body = ["username": username, "password": password]
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(body)
        
        return try await performRequest(request)
    }
    
    func refreshToken() async throws -> AuthResponse {
        guard let url = URL(string: "\(baseURL)/auth/refresh") else {
            throw AuthError.networkError
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add current access token to headers if available
        if let token = UserDefaults.standard.string(forKey: "access_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else {
            throw AuthError.refreshTokenMissing
        }
        
        return try await performRequest(request)
    }
    
    private func performRequest(_ request: URLRequest) async throws -> AuthResponse {
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw AuthError.networkError
            }
            
            print("Response status code: \(httpResponse.statusCode)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("Response data: \(responseString)")
            }
            
            switch httpResponse.statusCode {
            case 200, 201:
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                do {
                    let authResponse = try decoder.decode(AuthResponse.self, from: data)
                    return authResponse
                } catch {
                    print("Decoding error: \(error)")
                    throw AuthError.decodingError
                }
            case 401:
                throw AuthError.invalidCredentials
            default:
                if let responseString = String(data: data, encoding: .utf8) {
                    throw AuthError.serverError("Server error: \(responseString)")
                } else {
                    throw AuthError.serverError("Server returned status code \(httpResponse.statusCode)")
                }
            }
        } catch let error as AuthError {
            throw error
        } catch {
            if (error as NSError).code == NSURLErrorCancelled {
                // Ignore cancellation errors
                throw AuthError.networkError
            }
            print("Network error: \(error)")
            throw AuthError.networkError
        }
    }
} 