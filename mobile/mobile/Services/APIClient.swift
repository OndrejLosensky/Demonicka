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

class APIClient {
    static let shared = APIClient()
    private let session = URLSession.shared
    
    private init() {}
    
    func fetch<T: Decodable>(_ endpoint: String) async throws -> T {
        // Ensure endpoint doesn't start with a slash if it's provided
        let cleanEndpoint = endpoint.hasPrefix("/") ? String(endpoint.dropFirst()) : endpoint
        
        // Construct the full URL with API prefix
        let urlString = "\(Config.baseURL)\(Config.API.prefix)/\(cleanEndpoint)"
        print("🌐 Making request to: \(urlString)")
        
        guard let url = URL(string: urlString) else {
            print("❌ Invalid URL: \(urlString)")
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = Config.API.headers
        
        print("📤 Request headers: \(Config.API.headers)")
        
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
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601
            
            print("📦 Response data: \(String(data: data, encoding: .utf8) ?? "Unable to read data")")
            
            return try decoder.decode(T.self, from: data)
        } catch let error as DecodingError {
            print("❌ Decoding error: \(error)")
            throw APIError.decodingError(error)
        } catch {
            print("❌ Network error: \(error)")
            throw APIError.networkError(error)
        }
    }
} 