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
            mainContent
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
    
    // MARK: - Main Content
    private var mainContent: some View {
        VStack(spacing: 24) {
            systemSection
            Spacer()
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
            tokenSheet
        }
        .sheet(isPresented: $showingSystemStats) {
            systemStatsSheet
        }
    }
    
    // MARK: - System Section
    private var systemSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Systém")
                .font(.headline)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Button(action: {
                Task {
                    await handleLoadSystemStats()
                }
            }) {
                HStack {
                    Image(systemName: "person.2")
                        .foregroundColor(AppColors.primary)
                        .font(.title2)
                    Text("Zobrazit uživatele")
                        .font(.title3)
                    Spacer()
                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
            }
            .disabled(isLoading)
            .padding(.horizontal)
        }
    }
    
    // MARK: - Token Sheet
    private var tokenSheet: some View {
        Group {
            if let token = currentToken {
                NavigationView {
                    tokenContent(token: token)
                }
                .navigationViewStyle(StackNavigationViewStyle())
            }
        }
    }
    
    // MARK: - Token Content
    private func tokenContent(token: String) -> some View {
        VStack(spacing: 24) {
            tokenHeader
            tokenDisplay(token: token)
            qrCodeSection(token: token)
            instructionsSection
            Spacer()
        }
        .padding()
        .navigationTitle("Token")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarItems(
            leading: Button("Zavřít") { showingToken = false },
            trailing: HStack(spacing: 12) {
                shareButton(token: token)
                copyButton(token: token)
            }
        )
    }
    
    // MARK: - Token Header
    private var tokenHeader: some View {
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
    }
    
    // MARK: - Token Display
    private func tokenDisplay(token: String) -> some View {
        VStack(spacing: 12) {
            Text("Token")
                .font(.caption)
                .foregroundColor(.secondary)
            
            ZStack {
                tokenText(token: token)
                
                if showingCopyFeedback {
                    copyFeedbackOverlay
                }
            }
        }
    }
    
    // MARK: - Token Text
    private func tokenText(token: String) -> some View {
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
    }
    
    // MARK: - Copy Feedback Overlay
    private var copyFeedbackOverlay: some View {
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
    
    // MARK: - QR Code Section
    private func qrCodeSection(token: String) -> some View {
        VStack(spacing: 12) {
            Text("QR Kód pro registraci")
                .font(.headline)
                .fontWeight(.semibold)
            
            Text("Naskenujte pro přechod na web")
                .font(.caption)
                .foregroundColor(.secondary)
            
            QRCodeView(token: token, size: 180)
        }
    }
    
    // MARK: - Instructions Section
    private var instructionsSection: some View {
        VStack(spacing: 8) {
            Text("Jak použít:")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(alignment: .leading, spacing: 6) {
                instructionRow(number: "1.", text: "Naskenujte QR kód pro přechod na web")
                instructionRow(number: "2.", text: "Nebo zkopírujte token a vložte na web")
                instructionRow(number: "3.", text: "Dokončete registraci s uživatelským jménem a heslem")
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Instruction Row
    private func instructionRow(number: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(number)
                .font(.caption)
                .foregroundColor(AppColors.primary)
                .fontWeight(.bold)
            Text(text)
                .font(.caption)
        }
    }
    
    // MARK: - Share Button
    private func shareButton(token: String) -> some View {
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
    }
    
    // MARK: - Copy Button
    private func copyButton(token: String) -> some View {
        Button("Kopírovat") {
            UIPasteboard.general.string = token
            
            let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
            impactFeedback.impactOccurred()
            
            showingCopyFeedback = true
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                showingCopyFeedback = false
            }
        }
    }
    
    // MARK: - System Stats Sheet
    private var systemStatsSheet: some View {
        NavigationView {
            systemStatsContent
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
    
    // MARK: - System Stats Content
    private var systemStatsContent: some View {
        Group {
            if let stats = systemStats {
                systemStatsList(stats: stats)
            } else {
                ProgressView()
                    .navigationTitle("Systémové statistiky")
            }
        }
    }
    
    // MARK: - System Stats List
    private func systemStatsList(stats: SystemStats) -> some View {
        List {
            overviewSection(stats: stats)
            usersSection(stats: stats)
        }
        .navigationTitle("Systémové statistiky")
        .navigationBarItems(trailing: Button("Done") {
            showingSystemStats = false
        })
    }
    
    // MARK: - Overview Section
    private func overviewSection(stats: SystemStats) -> some View {
        Section(header: Text("Přehled")) {
            StatRow(title: "Celkem uživatelů", value: "\(stats.totalUsers)")
            StatRow(title: "Admin uživatelé", value: "\(stats.totalAdminUsers)")
            StatRow(title: "Kompletní registrace", value: "\(stats.totalCompletedRegistrations)")
            StatRow(title: "2FA Oveření", value: "\(stats.total2FAEnabled)")
        }
    }
    
    // MARK: - Users Section
    private func usersSection(stats: SystemStats) -> some View {
        Section(header: Text("Uživatelé")) {
            ForEach(stats.users) { user in
                userRow(user: user)
            }
        }
    }
    
    // MARK: - User Row
    private func userRow(user: SystemUser) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(user.username)
                .font(.headline)
            
            HStack {
                roleBadge(user: user)
                registrationBadge(user: user)
                twoFactorBadge(user: user)
                Spacer()
                tokenButton(user: user)
            }
        }
        .padding(.vertical, 4)
    }
    
    // MARK: - Role Badge
    private func roleBadge(user: SystemUser) -> some View {
        Text(user.role)
            .font(.caption)
            .padding(4)
            .background(user.role == "ADMIN" ? AppColors.error.opacity(0.2) : AppColors.success.opacity(0.2))
            .cornerRadius(4)
    }
    
    // MARK: - Registration Badge
    private func registrationBadge(user: SystemUser) -> some View {
        Group {
            if !user.isRegistrationComplete {
                Text("Nekompletní")
                    .font(.caption)
                    .padding(4)
                    .background(AppColors.warning.opacity(0.2))
                    .cornerRadius(4)
            }
        }
    }
    
    // MARK: - Two Factor Badge
    private func twoFactorBadge(user: SystemUser) -> some View {
        Group {
            if user.isTwoFactorEnabled {
                Text("2FA")
                    .font(.caption)
                    .padding(4)
                    .background(AppColors.primary.opacity(0.2))
                    .cornerRadius(4)
            }
        }
    }
    
    // MARK: - Token Button
    private func tokenButton(user: SystemUser) -> some View {
        Group {
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
    
    // MARK: - Data Loading
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

// MARK: - Supporting Views
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
