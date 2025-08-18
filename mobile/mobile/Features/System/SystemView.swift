import SwiftUI

struct SystemView: View {
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showingError = false
    @State private var systemStats: SystemStats?
    @State private var showingSystemStats = false
    @State private var generatingTokenForUserId: String? = nil
    @State private var showingToken = false
    @State private var currentToken: String? = nil
    @State private var showingCopyFeedback = false
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Systém")) {
                    Button(action: {
                        Task {
                            await handleLoadSystemStats()
                        }
                    }) {
                        HStack {
                            Image(systemName: "person.2")
                                .foregroundColor(AppColors.primary)
                            Text("Zobrazit uživatele")
                            Spacer()
                            if isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                    }
                    .disabled(isLoading)
                }
                

            }
            .navigationTitle("Systém")
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
            } message: {
                if let apiError = error as? APIError {
                    Text(apiError.description)
                } else {
                    Text(error?.localizedDescription ?? "An unknown error occurred")
                }
            }
            .sheet(isPresented: $showingToken) {
                if let token = currentToken {
                    NavigationView {
                        VStack(spacing: 24) {
                            // Header
                            VStack(spacing: 8) {
                                Image(systemName: "key.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(AppColors.primary)
                                
                                Text("Registrační token")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                
                                Text("Token pro dokončení registrace")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                            
                            // Token display
                            VStack(spacing: 12) {
                                Text("Token")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                ZStack {
                                    VStack(spacing: 4) {
                                        if token.contains("#") {
                                            let parts = token.split(separator: "#")
                                            if parts.count == 2 {
                                                Text(String(parts[0]))
                                                    .font(.title2)
                                                    .fontWeight(.bold)
                                                    .foregroundColor(AppColors.primary)
                                                Text("#\(parts[1])")
                                                    .font(.title3)
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(.secondary)
                                            } else {
                                                Text(token)
                                                    .font(.title3)
                                                    .fontWeight(.bold)
                                            }
                                        } else {
                                            Text(token)
                                                .font(.title3)
                                                .fontWeight(.bold)
                                        }
                                    }
                                    .padding()
                                    .background(AppColors.primary.opacity(0.1))
                                    .cornerRadius(12)
                                    .textSelection(.enabled)
                                    
                                    // Copy feedback overlay
                                    if showingCopyFeedback {
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(AppColors.success.opacity(0.9))
                                            .overlay(
                                                HStack(spacing: 8) {
                                                    Image(systemName: "checkmark.circle.fill")
                                                        .foregroundColor(.white)
                                                    Text("Zkopírováno!")
                                                        .font(.caption)
                                                        .fontWeight(.semibold)
                                                        .foregroundColor(.white)
                                                }
                                            )
                                            .transition(.opacity)
                                            .animation(.easeInOut(duration: 0.2), value: showingCopyFeedback)
                                    }
                                }
                            }
                            
                            // QR Code
                            VStack(spacing: 12) {
                                Text("QR Kód pro registraci")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                
                                Text("Naskenujte pro přechod na web")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                QRCodeView(token: token, size: 180)
                            }
                            
                            // Instructions
                            VStack(spacing: 8) {
                                Text("Jak použít:")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack(alignment: .top, spacing: 8) {
                                        Text("1.")
                                            .font(.caption)
                                            .foregroundColor(AppColors.primary)
                                            .fontWeight(.bold)
                                        Text("Naskenujte QR kód pro přechod na web")
                                            .font(.caption)
                                    }
                                    
                                    HStack(alignment: .top, spacing: 8) {
                                        Text("2.")
                                            .font(.caption)
                                            .foregroundColor(AppColors.primary)
                                            .fontWeight(.bold)
                                        Text("Nebo zkopírujte token a vložte na web")
                                            .font(.caption)
                                    }
                                    
                                    HStack(alignment: .top, spacing: 8) {
                                        Text("3.")
                                            .font(.caption)
                                            .foregroundColor(AppColors.primary)
                                            .fontWeight(.bold)
                                        Text("Dokončete registraci s uživatelským jménem a heslem")
                                            .font(.caption)
                                    }
                                }
                                .padding(.horizontal)
                            }
                            
                            Spacer()
                        }
                        .padding()
                        .navigationTitle("Token")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationBarItems(
                            leading: Button("Zavřít") {
                                showingToken = false
                            },
                            trailing: HStack(spacing: 12) {
                                Button(action: {
                                    let registrationURL = QRCodeGenerator.generateRegistrationURL(from: token)
                                    let activityVC = UIActivityViewController(
                                        activityItems: [registrationURL],
                                        applicationActivities: nil
                                    )
                                    
                                    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                                       let window = windowScene.windows.first {
                                        window.rootViewController?.present(activityVC, animated: true)
                                    }
                                }) {
                                    Image(systemName: "square.and.arrow.up")
                                        .foregroundColor(AppColors.primary)
                                }
                                
                                Button("Kopírovat") {
                                    UIPasteboard.general.string = token
                                    
                                    // Haptic feedback
                                    let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                                    impactFeedback.impactOccurred()
                                    
                                    showingCopyFeedback = true
                                    
                                    // Hide feedback after 2 seconds
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                        showingCopyFeedback = false
                                    }
                                }
                            }
                        )
                    }
                }
            }
            .sheet(isPresented: $showingSystemStats) {
                NavigationView {
                    if let stats = systemStats {
                        List {
                            Section(header: Text("Přehled")) {
                                StatRow(title: "Celkem uživatelů", value: "\(stats.totalUsers)")
                                StatRow(title: "Admin uživatelé", value: "\(stats.totalAdminUsers)")
                                StatRow(title: "Kompletní registrace", value: "\(stats.totalCompletedRegistrations)")
                                StatRow(title: "2FA Oveření", value: "\(stats.total2FAEnabled)")
                            }
                            
                            Section(header: Text("Uživatelé")) {
                                ForEach(stats.users) { user in
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(user.username)
                                            .font(.headline)
                                        HStack {
                                            Text(user.role)
                                                .font(.caption)
                                                .padding(4)
                                                .background(user.role == "ADMIN" ? AppColors.error.opacity(0.2) : AppColors.success.opacity(0.2))
                                                .cornerRadius(4)
                                            
                                            if !user.isRegistrationComplete {
                                                Text("Nekompletní")
                                                    .font(.caption)
                                                    .padding(4)
                                                    .background(AppColors.warning.opacity(0.2))
                                                    .cornerRadius(4)
                                            }
                                            
                                            if user.isTwoFactorEnabled {
                                                Text("2FA")
                                                    .font(.caption)
                                                    .padding(4)
                                                    .background(AppColors.primary.opacity(0.2))
                                                    .cornerRadius(4)
                                            }
                                            
                                            Spacer()
                                            
                                            if !user.isRegistrationComplete {
                                                Button(action: {
                                                    Task {
                                                        await handleGenerateToken(userId: user.id)
                                                    }
                                                }) {
                                                    HStack {
                                                        if generatingTokenForUserId == user.id {
                                                            ProgressView()
                                                                .scaleEffect(0.8)
                                                        } else {
                                                            Image(systemName: "key.fill")
                                                            Text("Token")
                                                        }
                                                    }
                                                    .font(.caption)
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 4)
                                                    .background(AppColors.primary.opacity(0.2))
                                                    .cornerRadius(4)
                                                }
                                                .disabled(generatingTokenForUserId != nil)
                                            }
                                        }
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }
                        .navigationTitle("Systémové statistiky")
                        .navigationBarItems(trailing: Button("Done") {
                            showingSystemStats = false
                        })
                    } else {
                        ProgressView()
                            .navigationTitle("Systémové statistiky")
                    }
                }
            }
        }
    }
    

    
    private func handleLoadSystemStats() async {
        isLoading = true
        error = nil
        
        do {
            systemStats = try await SystemService.shared.getSystemStats()
            showingSystemStats = true
        } catch {
            self.error = error
            showingError = true
        }
        
        isLoading = false
    }
    
    private func handleGenerateToken(userId: String) async {
        guard generatingTokenForUserId == nil else { return }
        
        generatingTokenForUserId = userId
        error = nil
        
        do {
            let token = try await SystemService.shared.generateRegisterToken(userId: userId)
            currentToken = token
            showingToken = true
        } catch {
            self.error = error
            showingError = true
        }
        
        generatingTokenForUserId = nil
    }
}

struct StatRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .bold()
        }
    }
} 
