import Foundation

@MainActor
class LoginViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isAuthenticated = false
    @Published private(set) var currentUser: User?
    
    private let authService = AuthService()
    
    // Auto-login on init
    init() {
        Task {
            await autoLogin()
        }
    }
    
    private func autoLogin() async {
        print("Starting auto-login...")
        isLoading = true
        
        do {
            // Use hardcoded credentials
            let response = try await authService.login(username: "Vycepak", password: "Demonicka2025")
            print("Auto-login successful")
            
            // Store token and user info
            UserDefaults.standard.set(response.access_token, forKey: "access_token")
            if let userData = try? JSONEncoder().encode(response.user) {
                UserDefaults.standard.set(userData, forKey: "current_user")
            }
            
            currentUser = response.user
            isAuthenticated = true
        } catch {
            print("Auto-login failed with error: \(error)")
            errorMessage = "Auto-login failed"
        }
        
        isLoading = false
    }
    
    func logout() {
        print("Logging out...")
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "current_user")
        currentUser = nil
        isAuthenticated = false
        print("Logout completed")
    }
} 