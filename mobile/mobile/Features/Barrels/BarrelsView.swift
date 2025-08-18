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
                        VStack(spacing: UIDevice.current.userInterfaceIdiom == .pad ? 32 : 20) {
                            // Active barrels chart view
                            VStack(spacing: UIDevice.current.userInterfaceIdiom == .pad ? 24 : 20) {
                                HStack {
                                    Image(systemName: "chart.pie.fill")
                                        .foregroundColor(AppColors.primary)
                                        .font(UIDevice.current.userInterfaceIdiom == .pad ? .title : .title2)
                                    Text("Aktivní sudy")
                                        .font(UIDevice.current.userInterfaceIdiom == .pad ? .title : .headline)
                                        .fontWeight(.bold)
                                    Spacer()
                                }
                                .padding(.horizontal)
                                
                                LazyVGrid(
                                    columns: [
                                        GridItem(.flexible()),
                                        GridItem(.flexible())
                                    ],
                                    spacing: 24
                                ) {
                                    ForEach(barrels.filter { $0.isActive }) { barrel in
                                        VStack {
                                            CircularProgressView(
                                                progress: barrel.remainingPercentage / 100.0,
                                                total: barrel.totalBeers,
                                                current: barrel.remainingBeers,
                                                size: barrel.size
                                            )
                                            
                                            // Barrel status indicator
                                            HStack {
                                                Circle()
                                                    .fill(AppColors.success)
                                                    .frame(width: 8, height: 8)
                                                Text("Aktivní")
                                                    .font(.caption)
                                                    .foregroundColor(.secondary)
                                            }
                                            .padding(.top, 8)
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                            
                            // All barrels table view
                            VStack(alignment: .leading, spacing: 16) {
                                HStack {
                                    Image(systemName: "list.bullet")
                                        .foregroundColor(AppColors.primary)
                                        .font(.title2)
                                    Text("Všechny sudy")
                                        .font(.headline)
                                        .fontWeight(.bold)
                                    Spacer()
                                }
                                .padding(.horizontal)
                                
                                LazyVStack(spacing: 12) {
                                    ForEach(barrels) { barrel in
                                        HStack(spacing: 16) {
                                            // Barrel icon with status
                                            ZStack {
                                                Image(systemName: "cylinder.fill")
                                                    .font(.title2)
                                                    .foregroundColor(barrel.isActive ? AppColors.success : .gray)
                                                
                                                if barrel.isActive {
                                                    Circle()
                                                        .fill(AppColors.success)
                                                        .frame(width: 6, height: 6)
                                                        .offset(x: 8, y: -8)
                                                }
                                            }
                                            
                                            // Barrel info
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text("\(barrel.size)L")
                                                    .font(.headline)
                                                    .fontWeight(.semibold)
                                                Text(barrel.isActive ? "Aktivní" : "Neaktivní")
                                                    .font(.caption)
                                                    .foregroundColor(barrel.isActive ? AppColors.success : .secondary)
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 2)
                                                    .background(
                                                        RoundedRectangle(cornerRadius: 6)
                                                            .fill(barrel.isActive ? AppColors.success.opacity(0.1) : Color.gray.opacity(0.1))
                                                    )
                                            }
                                            
                                            Spacer()
                                            
                                            // Beer count
                                            VStack(alignment: .trailing, spacing: 4) {
                                                Text("\(barrel.remainingBeers)/\(barrel.totalBeers)")
                                                    .font(.title3)
                                                    .fontWeight(.bold)
                                                Text("piv")
                                                    .font(.caption)
                                                    .foregroundColor(.secondary)
                                            }
                                        }
                                        .padding(16)
                                        .background(
                                            RoundedRectangle(cornerRadius: 12)
                                                .fill(Color(.secondarySystemBackground))
                                                .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
                                        )
                                        .padding(.horizontal)
                                    }
                                }
                            }
                        }
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
        .navigationViewStyle(StackNavigationViewStyle()) // Force stack navigation style
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
            // Generate a simple order number (could be improved to get the next available number)
            let nextOrderNumber = barrels.isEmpty ? 1 : (barrels.map { $0.orderNumber }.max() ?? 0) + 1
            
            let barrel = CreateBarrel(
                size: size,
                orderNumber: nextOrderNumber
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
