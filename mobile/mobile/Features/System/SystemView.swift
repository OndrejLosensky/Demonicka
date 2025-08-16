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
                                .foregroundColor(.blue)
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
                
                Section(header: Text("Databáze")) {
                    Button(action: {
                        Task {
                            await handleCleanup()
                        }
                    }) {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                            Text("Vyčistit databázi (KRITICKÉ)")
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
            .alert("Registrační token", isPresented: $showingToken) {
                Button("Copy", action: {
                    if let token = currentToken {
                        UIPasteboard.general.string = token
                    }
                })
                Button("OK", role: .cancel) {}
            } message: {
                if let token = currentToken {
                    Text(token)
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
                                                .background(user.role == "ADMIN" ? Color.red.opacity(0.2) : Color.green.opacity(0.2))
                                                .cornerRadius(4)
                                            
                                            if !user.isRegistrationComplete {
                                                Text("Nekompletní")
                                                    .font(.caption)
                                                    .padding(4)
                                                    .background(Color.yellow.opacity(0.2))
                                                    .cornerRadius(4)
                                            }
                                            
                                            if user.isTwoFactorEnabled {
                                                Text("2FA")
                                                    .font(.caption)
                                                    .padding(4)
                                                    .background(Color.blue.opacity(0.2))
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
                                                    .background(Color.blue.opacity(0.2))
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
    
    private func handleCleanup() async {
        isLoading = true
        error = nil
        
        do {
            try await SystemService.shared.cleanup()
        } catch {
            self.error = error
            showingError = true
        }
        
        isLoading = false
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
