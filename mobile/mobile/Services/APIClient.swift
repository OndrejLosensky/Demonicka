import Foundation

enum APIError: Error, CustomStringConvertible {
    case invalidURL
    case invalidResponse
    case networkError(Error)
    case decodingError(Error)
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
    
    func fetch<T: Decodable>(_ endpoint: String, method: HTTPMethod = .get) async throws -> T {
        let (data, response) = try await makeRequest(endpoint, method: method)
        
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
    
    func requestWithoutResponse(_ endpoint: String, method: HTTPMethod) async throws {
        _ = try await makeRequest(endpoint, method: method)
    }
    
    private func makeRequest(_ endpoint: String, method: HTTPMethod) async throws -> (Data, HTTPURLResponse) {
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
        request.allHTTPHeaderFields = Config.API.headers
        
        do {
            let (data, response) = try await session.data(for: request)
            
            print("📥 Received response: \(response)")
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type")
                throw APIError.invalidResponse
            }
            
            print("📊 Status code: \(httpResponse.statusCode)")
            
            guard (200...299).contains(httpResponse.statusCode) else {
                print("❌ Server error: \(httpResponse.statusCode)")
                print("Error response: \(String(data: data, encoding: .utf8) ?? "No error message")")
                throw APIError.serverError(httpResponse.statusCode, data)
            }
            
            print("📦 Response data: \(String(data: data, encoding: .utf8) ?? "Unable to read data")")
            return (data, httpResponse)
        } catch {
            print("❌ Network error: \(error)")
            throw APIError.networkError(error)
        }
    }
} 
