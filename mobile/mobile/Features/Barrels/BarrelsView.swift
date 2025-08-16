import SwiftUI

struct BarrelsView: View {
    @State private var barrels: [Barrel] = []
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showingError = false
    @State private var showingAddDialog = false
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading && barrels.isEmpty {
                    ProgressView("Načítám sudy...")
                } else if barrels.isEmpty {
                    VStack {
                        Image(systemName: "mug.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                            .padding()
                        Text("Žádný aktivní sud")
                            .font(.title2)
                            .foregroundColor(.primary)
                        Text("Nejsou žádné sudy")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(UIColor.systemBackground))
                } else {
                    ScrollView {
                        LazyVGrid(
                            columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ],
                            spacing: 20
                        ) {
                            ForEach(barrels.filter { $0.isActive }) { barrel in
                                CircularProgressView(
                                    progress: barrel.remainingPercentage / 100.0,
                                    total: barrel.totalBeers,
                                    current: barrel.remainingBeers,
                                    size: barrel.size
                                )
                                .frame(height: 180)
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await loadBarrels()
                    }
                }
            }
            .navigationTitle("Sudy")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddDialog = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddDialog) {
                AddBarrelDialog(isPresented: $showingAddDialog) { size in
                    Task {
                        await handleAddBarrel(size: size)
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
                Button("Opakovat") {
                    Task {
                        await loadBarrels()
                    }
                }
            } message: {
                if let apiError = error as? APIError {
                    Text(apiError.description)
                } else {
                    Text(error?.localizedDescription ?? "An unknown error occurred")
                }
            }
        }
        .onAppear {
            Task {
                await loadBarrels()
            }
        }
    }
    
    private func loadBarrels() async {
        print("📱 Starting to load barrels...")
        isLoading = true
        error = nil
        
        do {
            barrels = try await BarrelService.shared.fetchBarrels()
            print("✅ Successfully loaded \(barrels.count) barrels")
            let activeBarrels = barrels.filter { $0.isActive }
            print("🔵 Active barrels: \(activeBarrels.count)")
            
            if barrels.isEmpty {
                print("⚠️ No barrels returned from API")
            }
        } catch {
            print("❌ Error loading barrels: \(error)")
            if let apiError = error as? APIError {
                print("📝 API Error details: \(apiError.description)")
            }
            self.error = error
            showingError = true
        }
        
        isLoading = false
    }
    
    private func handleAddBarrel(size: Int) async {
        do {
            let barrel = CreateBarrel(
                size: size,
                totalBeers: size * 2, // 1L = 2 beers
                remainingBeers: size * 2
            )
            try await BarrelService.shared.createBarrel(barrel)
            await loadBarrels()
        } catch {
            self.error = error
            showingError = true
        }
    }
}

#Preview {
    BarrelsView()
} 
