import Foundation

enum APIError: Error, CustomStringConvertible {
    case invalidURL
    case invalidResponse
    case networkError(Error)
    case decodingError(Error)
    case encodingError(Error)
    case serverError(Int, Data?)
    
    var description: String {
        switch self {
        case .invalidURL:
            return "Invalid URL constructed"
        case .invalidResponse:
            return "Invalid response from server"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to decode response: \(error)"
        case .encodingError(let error):
            return "Failed to encode request: \(error)"
        case .serverError(let code, let data):
            if let data = data, let errorMessage = String(data: data, encoding: .utf8) {
                return "Server error (\(code)): \(errorMessage)"
            }
            return "Server error with status code: \(code)"
        }
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case delete = "DELETE"
    case put = "PUT"
    case patch = "PATCH"
}

class APIClient {
    static let shared = APIClient()
    private let session = URLSession.shared
    private let dateFormatter: DateFormatter
    
    private init() {
        dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        dateFormatter.timeZone = TimeZone(abbreviation: "UTC")
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
    }
    
    func fetch<T: Decodable>(_ endpoint: String, method: HTTPMethod = .get, body: Encodable? = nil) async throws -> T {
        let (data, response) = try await makeRequest(endpoint, method: method, body: body)
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            if let date = self.dateFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string \(dateString)"
            )
        }
        
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            print("❌ Decoding error: \(error)")
            throw APIError.decodingError(error)
        }
    }
    
    func requestWithoutResponse(_ endpoint: String, method: HTTPMethod, body: Encodable? = nil) async throws {
        _ = try await makeRequest(endpoint, method: method, body: body)
    }
    
    private func makeRequest(_ endpoint: String, method: HTTPMethod, body: Encodable? = nil) async throws -> (Data, HTTPURLResponse) {
        // Ensure endpoint doesn't start with a slash if it's provided
        let cleanEndpoint = endpoint.hasPrefix("/") ? String(endpoint.dropFirst()) : endpoint
        
        // Construct the full URL with API prefix
        let urlString = "\(Config.baseURL)\(Config.API.prefix)/\(cleanEndpoint)"
        print("🌐 Making \(method.rawValue) request to: \(urlString)")
        
        guard let url = URL(string: urlString) else {
            print("❌ Invalid URL: \(urlString)")
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // Use Config.API.headers which already contains the bypass token
        request.allHTTPHeaderFields = Config.API.headers
        print("🔑 Request headers: \(Config.API.headers)")
        
                    if let body = body {
                do {
                    let encoder = JSONEncoder()
                    // Don't convert to snake_case - send as camelCase to match server expectations
                    request.httpBody = try encoder.encode(body)
                    print("📦 Request body: \(String(data: request.httpBody!, encoding: .utf8) ?? "")")
                } catch {
                    print("❌ Encoding error: \(error)")
                    throw APIError.encodingError(error)
                }
            }
        
        do {
            print("📤 Starting request to: \(urlString)")
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type")
                throw APIError.invalidResponse
            }
            
            print("""
                  📥 Response received:
                  - Status code: \(httpResponse.statusCode)
                  - Headers: \(httpResponse.allHeaderFields)
                  - Data: \(String(data: data, encoding: .utf8) ?? "Unable to decode response data")
                  """)
            
            guard (200...299).contains(httpResponse.statusCode) else {
                print("""
                      ❌ Server error:
                      - Status code: \(httpResponse.statusCode)
                      - Response: \(String(data: data, encoding: .utf8) ?? "No error message")
                      """)
                throw APIError.serverError(httpResponse.statusCode, data)
            }
            
            return (data, httpResponse)
        } catch {
            print("""
                  ❌ Network error:
                  - Error: \(error)
                  - Description: \(error.localizedDescription)
                  """)
            throw APIError.networkError(error)
        }
    }
} 
