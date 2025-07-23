import Foundation
import UIKit

class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    
    private let apiClient = APIClient.shared
    
    private init() {
        // Check if we have stored tokens on init
        checkExistingAuth()
    }
    
    // MARK: - Public Methods
    
    func simulateAdminLogin() async throws {
        await MainActor.run {
            isLoading = true
        }
        
        do {
            // Create device token
            let deviceToken = UUID().uuidString
            
            // Build login request
            let loginRequest = AdminLoginRequest(
                username: Config.adminUsername,
                password: Config.adminPassword,
                deviceToken: deviceToken,
                deviceType: Config.deviceType,
                deviceName: UIDevice.current.name,
                deviceModel: UIDevice.current.model,
                osVersion: UIDevice.current.systemVersion
            )
            
            Config.printDebug("Attempting admin login...")
            
            // Perform login
            let response: AdminLoginResponse = try await apiClient.post(
                endpoint: "/v1/auth/admin/login",
                body: loginRequest,
                responseType: AdminLoginResponse.self,
                requiresAuth: false
            )
            
            // Store tokens
            apiClient.setTokens(
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            )
            
            // Update UI state
            await MainActor.run {
                self.currentUser = response.user
                self.isAuthenticated = true
                self.isLoading = false
            }
            
            Config.printDebug("Admin login successful for user: \(response.user.username)")
            
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
            Config.printDebug("Login failed: \(error.localizedDescription)")
            throw error
        }
    }
    
    func logout() async {
        await MainActor.run {
            isLoading = true
        }
        
        do {
            // Try to logout on server (but don't worry if it fails)
            try? await apiClient.post(
                endpoint: "/v1/auth/admin/logout",
                body: EmptyResponse(),
                responseType: EmptyResponse.self
            )
        } catch {
            Config.printDebug("Server logout failed (but continuing): \(error)")
        }
        
        // Clear local state regardless
        apiClient.clearTokens()
        
        await MainActor.run {
            self.currentUser = nil
            self.isAuthenticated = false
            self.isLoading = false
        }
        
        Config.printDebug("User logged out")
    }
    
    func checkAuthStatus() async {
        // If we don't have tokens, we're not authenticated
        guard apiClient.hasValidTokens() else {
            await MainActor.run {
                self.isAuthenticated = false
                self.currentUser = nil
            }
            return
        }
        
        do {
            // Try to get current user to validate token
            let user: User = try await apiClient.get(
                endpoint: "/auth/me",
                responseType: User.self
            )
            
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
            }
            
            Config.printDebug("Auth status validated - user: \(user.username)")
            
        } catch APIError.unauthorized {
            // Token is invalid
            apiClient.clearTokens()
            await MainActor.run {
                self.isAuthenticated = false
                self.currentUser = nil
            }
            Config.printDebug("Token validation failed - user logged out")
            
        } catch {
            Config.printDebug("Auth check failed: \(error)")
            // Don't logout on network errors, just log the issue
        }
    }
    
    // MARK: - Private Methods
    
    private func checkExistingAuth() {
        // For now, we don't persist tokens (local app only)
        // In a real app, you'd check Keychain here
        Config.printDebug("Checking for existing authentication...")
    }
    
    // MARK: - Utility Methods
    
    func requiresAuth() -> Bool {
        return !isAuthenticated || currentUser == nil
    }
    
    func isAdmin() -> Bool {
        return currentUser?.role == "ADMIN"
    }
    
    func getUserDisplayName() -> String {
        return currentUser?.displayName ?? "Unknown User"
    }
} 