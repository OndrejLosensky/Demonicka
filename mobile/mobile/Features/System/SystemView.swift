import SwiftUI
import UIKit

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
    @State private var lastSyncTime = "Nikdy"
    @State private var apiResponseTime = 0
    @State private var connectionHealth = "Dobré"
    
    // MARK: - Computed Properties
    
    private var apiConnectionStatus: String {
        // Simulate connection status based on response time
        if apiResponseTime == 0 { return "Testuji..." }
        if apiResponseTime < 100 { return "Výborné" }
        if apiResponseTime < 300 { return "Dobré" }
        if apiResponseTime < 1000 { return "Pomalé" }
        return "Problém"
    }
    
    private var apiConnectionColor: Color {
        if apiResponseTime == 0 { return .secondary }
        if apiResponseTime < 100 { return AppColors.success }
        if apiResponseTime < 300 { return AppColors.primary }
        if apiResponseTime < 1000 { return AppColors.warning }
        return AppColors.error
    }
    
    private var connectionHealthColor: Color {
        switch connectionHealth {
        case "Výborné": return AppColors.success
        case "Dobré": return AppColors.primary
        case "Slabé": return AppColors.warning
        case "Problém": return AppColors.error
        default: return .secondary
        }
    }
    
    private var appVersion: String {
        if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
            return version
        }
        return "Neznámá"
    }
    
    private var backendVersion: String {
        // This would come from API in real implementation
        return "2.0.0"
    }
    
    private var updateStatus: String {
        return "Aktuální"
    }
    
    private var updateStatusColor: Color {
        return AppColors.success
    }
    
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
        .onAppear {
            Task {
                await handleRefreshData()
            }
        }
    }
    
    // MARK: - System Section
    private var systemSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Systém")
                .font(.headline)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            // Quick Actions
            quickActionsSection
            
            // API Configuration
            apiConfigSection
            
            // System Status
            systemStatusSection
            
            // Version Information
            versionInfoSection
        }
    }
    
    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Rychlé akce")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            HStack(spacing: 12) {
                // View Users Button
                Button(action: {
                    Task {
                        await handleLoadSystemStats()
                    }
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "person.2")
                            .font(.title2)
                            .foregroundColor(AppColors.primary)
                        Text("Uživatelé")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                }
                .disabled(isLoading)
                
                // Refresh Data Button
                Button(action: {
                    Task {
                        await handleRefreshData()
                    }
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "arrow.clockwise")
                            .font(.title2)
                            .foregroundColor(AppColors.success)
                        Text("Obnovit")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                }
                .disabled(isLoading)
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - API Config Section
    private var apiConfigSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("API Konfigurace")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                infoRow(icon: "server.rack", title: "Backend", value: "demonicka.losensky.cloud", color: AppColors.primary)
                infoRow(icon: "wifi", title: "Stav", value: apiConnectionStatus, color: apiConnectionColor)
                infoRow(icon: "clock", title: "Odezva", value: "\(apiResponseTime)ms", color: AppColors.success)
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - System Status Section
    private var systemStatusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Stav systému")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                infoRow(icon: "arrow.triangle.2.circlepath", title: "Poslední sync", value: lastSyncTime, color: AppColors.primary)
                infoRow(icon: "network", title: "Připojení", value: connectionHealth, color: connectionHealthColor)
                infoRow(icon: "checkmark.shield", title: "Bezpečnost", value: "Aktivní", color: AppColors.success)
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Version Info Section
    private var versionInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Verze aplikace")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                infoRow(icon: "iphone", title: "iOS App", value: appVersion, color: AppColors.primary)
                infoRow(icon: "server.rack", title: "Backend", value: backendVersion, color: AppColors.secondary)
                infoRow(icon: "arrow.up.circle", title: "Aktualizace", value: updateStatus, color: updateStatusColor)
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Info Row Helper
    private func infoRow(icon: String, title: String, value: String, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 20)
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(8)
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
            
            // Update participant count
            if let stats = systemStats {
                // Note: participant count available in system stats if needed
            }
        } catch {
            self.error = error
            showingError = true
        }
        
        isLoading = false
    }
    
    private func handleRefreshData() async {
        isLoading = true
        error = nil
        
        do {
            // Test API connection and measure response time
            let startTime = Date()
            _ = try await SystemService.shared.getSystemStats()
            let endTime = Date()
            
            apiResponseTime = Int(endTime.timeIntervalSince(startTime) * 1000)
            lastSyncTime = formatDate(Date())
            
            // Update connection health based on response time
            if apiResponseTime < 100 {
                connectionHealth = "Výborné"
            } else if apiResponseTime < 300 {
                connectionHealth = "Dobré"
            } else if apiResponseTime < 1000 {
                connectionHealth = "Slabé"
            } else {
                connectionHealth = "Problém"
            }
            
            // Load system stats but don't show the dialog
            await loadSystemStatsSilently()
            
        } catch {
            self.error = error
            showingError = true
            apiResponseTime = 9999
            connectionHealth = "Problém"
        }
        
        isLoading = false
    }
    
    private func loadSystemStatsSilently() async {
        do {
            systemStats = try await SystemService.shared.getSystemStats()
        } catch {
            print("⚠️ Could not load system stats silently: \(error)")
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: date)
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
