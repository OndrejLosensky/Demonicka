import SwiftUI

struct SystemView: View {
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showingError = false
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Database")) {
                    Button(action: {
                        Task {
                            await handleCleanup()
                        }
                    }) {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                            Text("Cleanup Database")
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
            .navigationTitle("System")
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
            } message: {
                if let apiError = error as? APIError {
                    Text(apiError.description)
                } else {
                    Text(error?.localizedDescription ?? "An unknown error occurred")
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
} 