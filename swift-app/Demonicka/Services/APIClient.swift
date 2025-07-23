import Foundation

// MARK: - API Client Errors
enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case invalidResponse
    case unauthorized
    case serverError(Int)
    case networkError(Error)
    case decodingError(Error)
    case missingToken
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .invalidResponse:
            return "Invalid response"
        case .unauthorized:
            return "Unauthorized - token expired"
        case .serverError(let code):
            return "Server error: \(code)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .missingToken:
            return "Authentication token missing"
        }
    }
}

// MARK: - HTTP Methods
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case PATCH = "PATCH"
    case DELETE = "DELETE"
}

// MARK: - API Client
class APIClient: ObservableObject {
    static let shared = APIClient()
    
    private var accessToken: String?
    private var refreshToken: String?
    
    private init() {}
    
    // MARK: - Token Management
    func setTokens(accessToken: String, refreshToken: String) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        Config.printDebug("Tokens set successfully")
    }
    
    func clearTokens() {
        self.accessToken = nil
        self.refreshToken = nil
        Config.printDebug("Tokens cleared")
    }
    
    func hasValidTokens() -> Bool {
        return accessToken != nil && refreshToken != nil
    }
    
    // MARK: - Generic Request Method
    func request<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil,
        responseType: T.Type,
        requiresAuth: Bool = true
    ) async throws -> T {
        
        // Build URL
        guard let url = URL(string: "\(Config.baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        // Create request
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = Config.requestTimeout
        
        // Add headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.apiVersion, forHTTPHeaderField: "X-API-Version")
        
        // Add auth header if required
        if requiresAuth {
            guard let token = accessToken else {
                throw APIError.missingToken
            }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if provided
        if let body = body {
            request.httpBody = body
        }
        
        Config.printDebug("Making \(method.rawValue) request to: \(endpoint)")
        
        do {
            // Perform request
            let (data, response) = try await URLSession.shared.data(for: request)
            
            // Check HTTP response
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            Config.printDebug("Response status: \(httpResponse.statusCode)")
            
            // Handle different status codes
            switch httpResponse.statusCode {
            case 200...299:
                // Success - decode response
                if T.self == EmptyResponse.self {
                    return EmptyResponse() as! T
                }
                
                do {
                    let decoder = JSONDecoder()
                    let result = try decoder.decode(T.self, from: data)
                    return result
                } catch {
                    Config.printDebug("Decoding error: \(error)")
                    throw APIError.decodingError(error)
                }
                
            case 401:
                // Unauthorized - token expired
                Config.printDebug("Unauthorized - clearing tokens")
                clearTokens()
                throw APIError.unauthorized
                
            case 400...499:
                // Client error - try to decode error message
                if let errorResponse = try? JSONDecoder().decode(ApiErrorResponse.self, from: data) {
                    throw APIError.networkError(NSError(domain: "APIError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorResponse.message]))
                }
                throw APIError.serverError(httpResponse.statusCode)
                
            case 500...599:
                // Server error
                throw APIError.serverError(httpResponse.statusCode)
                
            default:
                throw APIError.serverError(httpResponse.statusCode)
            }
            
        } catch let error as APIError {
            throw error
        } catch {
            Config.printDebug("Network error: \(error)")
            throw APIError.networkError(error)
        }
    }
    
    // MARK: - Convenience Methods
    
    func get<T: Codable>(
        endpoint: String,
        responseType: T.Type,
        requiresAuth: Bool = true
    ) async throws -> T {
        return try await request(
            endpoint: endpoint,
            method: .GET,
            responseType: responseType,
            requiresAuth: requiresAuth
        )
    }
    
    func post<T: Codable, U: Codable>(
        endpoint: String,
        body: T?,
        responseType: U.Type,
        requiresAuth: Bool = true
    ) async throws -> U {
        var bodyData: Data?
        if let body = body {
            bodyData = try JSONEncoder().encode(body)
        }
        
        return try await request(
            endpoint: endpoint,
            method: .POST,
            body: bodyData,
            responseType: responseType,
            requiresAuth: requiresAuth
        )
    }
    
    func put<T: Codable, U: Codable>(
        endpoint: String,
        body: T?,
        responseType: U.Type,
        requiresAuth: Bool = true
    ) async throws -> U {
        var bodyData: Data?
        if let body = body {
            bodyData = try JSONEncoder().encode(body)
        }
        
        return try await request(
            endpoint: endpoint,
            method: .PUT,
            body: bodyData,
            responseType: responseType,
            requiresAuth: requiresAuth
        )
    }
    
    func patch<T: Codable, U: Codable>(
        endpoint: String,
        body: T?,
        responseType: U.Type,
        requiresAuth: Bool = true
    ) async throws -> U {
        var bodyData: Data?
        if let body = body {
            bodyData = try JSONEncoder().encode(body)
        }
        
        return try await request(
            endpoint: endpoint,
            method: .PATCH,
            body: bodyData,
            responseType: responseType,
            requiresAuth: requiresAuth
        )
    }
    
    func delete(
        endpoint: String,
        requiresAuth: Bool = true
    ) async throws {
        let _: EmptyResponse = try await request(
            endpoint: endpoint,
            method: .DELETE,
            responseType: EmptyResponse.self,
            requiresAuth: requiresAuth
        )
    }
} 