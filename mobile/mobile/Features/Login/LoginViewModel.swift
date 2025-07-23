import Foundation

@MainActor
class LoginViewModel: ObservableObject {
    @Published var username = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published var isAuthenticated = false {
        didSet {
            print("Authentication state changed: \(isAuthenticated)")
        }
    }
    @Published private(set) var currentUser: User?
    
    private let authService = AuthService()
    private var refreshTask: Task<Void, Never>?
    
    init() {
        print("LoginViewModel init")
        // Check for existing token and user data
        if let token = UserDefaults.standard.string(forKey: "access_token"),
           let userData = UserDefaults.standard.data(forKey: "current_user"),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            print("Found existing token and user")
            self.isAuthenticated = true
            self.currentUser = user
        }
    }
    
    deinit {
        refreshTask?.cancel()
    }
    
    func login() async {
        print("Login attempt with username: \(username)")
        guard !username.isEmpty && !password.isEmpty else {
            errorMessage = "Please enter both username and password"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await authService.login(username: username, password: password)
            print("Login successful, received token: \(response.access_token)")
            
            // Store token and user info
            UserDefaults.standard.set(response.access_token, forKey: "access_token")
            if let userData = try? JSONEncoder().encode(response.user) {
                UserDefaults.standard.set(userData, forKey: "current_user")
            }
            currentUser = response.user
            isAuthenticated = true
            print("Set isAuthenticated to true")
            
            // Start token refresh after a delay
            Task {
                try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
                await setupTokenRefresh()
            }
            
        } catch let error as AuthError {
            print("Login failed with error: \(error)")
            switch error {
            case .invalidCredentials:
                errorMessage = "Invalid username or password"
            case .networkError:
                errorMessage = "Network error. Please check your connection"
            case .serverError(let message):
                errorMessage = message
            case .decodingError:
                errorMessage = "Error processing server response"
            case .refreshTokenMissing:
                errorMessage = "Session expired, please log in again"
            }
        } catch {
            print("Unexpected error: \(error)")
            errorMessage = "An unexpected error occurred"
        }
        
        isLoading = false
    }
    
    func logout() {
        print("Logging out")
        // Cancel refresh task first
        refreshTask?.cancel()
        refreshTask = nil
        
        // Clear stored credentials
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "current_user")
        
        // Reset form and state
        username = ""
        password = ""
        currentUser = nil
        isAuthenticated = false
    }
    
    private func setupTokenRefresh() async {
        print("Setting up token refresh")
        // Cancel any existing refresh task
        refreshTask?.cancel()
        refreshTask = nil
        
        // Create new refresh task
        refreshTask = Task {
            while !Task.isCancelled {
                do {
                    // Wait for 14 minutes
                    try await Task.sleep(nanoseconds: 14 * 60 * 1_000_000_000)
                    
                    guard !Task.isCancelled else {
                        print("Token refresh task cancelled")
                        break
                    }
                    
                    print("Attempting token refresh")
                    let response = try await authService.refreshToken()
                    print("Token refresh successful")
                    
                    await MainActor.run {
                        UserDefaults.standard.set(response.access_token, forKey: "access_token")
                        if let userData = try? JSONEncoder().encode(response.user) {
                            UserDefaults.standard.set(userData, forKey: "current_user")
                        }
                        currentUser = response.user
                    }
                } catch let error as AuthError {
                    print("Token refresh failed: \(error)")
                    if !Task.isCancelled {
                        switch error {
                        case .refreshTokenMissing, .invalidCredentials:
                            await MainActor.run { logout() }
                        case .networkError:
                            // Retry after a short delay
                            try? await Task.sleep(nanoseconds: 5_000_000_000) // 5 seconds
                            continue
                        case .serverError, .decodingError:
                            await MainActor.run { logout() }
                        }
                    }
                    break
                } catch {
                    print("Unexpected error during token refresh: \(error)")
                    if !Task.isCancelled {
                        await MainActor.run { logout() }
                    }
                    break
                }
            }
        }
    }
} 