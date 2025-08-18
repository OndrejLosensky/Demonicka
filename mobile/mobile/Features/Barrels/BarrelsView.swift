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
                        VStack(spacing: UIDevice.current.userInterfaceIdiom == .pad ? 40 : 20) {
                            // Active barrels chart view
                            VStack(spacing: UIDevice.current.userInterfaceIdiom == .pad ? 32 : 20) {
                                HStack {
                                    Image(systemName: "chart.pie.fill")
                                        .foregroundColor(AppColors.primary)
                                        .font(UIDevice.current.userInterfaceIdiom == .pad ? .largeTitle : .title2)
                                        .imageScale(UIDevice.current.userInterfaceIdiom == .pad ? .large : .medium)
                                    Text("Aktivní sud")
                                        .font(UIDevice.current.userInterfaceIdiom == .pad ? .largeTitle : .headline)
                                        .fontWeight(.bold)
                                    Spacer()
                                }
                                .padding(.horizontal, UIDevice.current.userInterfaceIdiom == .pad ? 24 : 16)
                                
                                // iPad: Enhanced layout with better spacing and larger elements
                                if UIDevice.current.userInterfaceIdiom == .pad {
                                    // iPad: Single large circular progress with better spacing
                                    activeBarrelsChart(barrels: barrels.filter { $0.isActive })
                                        .padding(.horizontal, 24)
                                } else {
                                    // iPhone: Standard grid layout
                                    LazyVGrid(
                                        columns: [
                                            GridItem(.flexible()),
                                            GridItem(.flexible())
                                        ],
                                        spacing: 24
                                    ) {
                                        ForEach(barrels.filter { $0.isActive }) { barrel in
                                            activeBarrelCard(barrel: barrel)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
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
    
    // MARK: - iPad Layout Helpers
    
    // iPad: Large circular progress chart for active barrels
    private func activeBarrelsChart(barrels: [Barrel]) -> some View {
        VStack(spacing: 32) {
            if let firstBarrel = barrels.first {
                VStack(spacing: 24) {
                    // Compact circular progress for iPad with proper text fit
                    CircularProgressView(
                        progress: firstBarrel.remainingPercentage / 100.0,
                        total: firstBarrel.totalBeers,
                        current: firstBarrel.remainingBeers,
                        size: firstBarrel.size
                    )
                    .scaleEffect(UIDevice.current.userInterfaceIdiom == .pad ? 1.2 : 1.0) // Smaller, more compact
                    .frame(width: UIDevice.current.userInterfaceIdiom == .pad ? 180 : nil, 
                           height: UIDevice.current.userInterfaceIdiom == .pad ? 180 : nil)
                    
                    // Enhanced status indicator for iPad
                    HStack(spacing: 16) {
                        Circle()
                            .fill(AppColors.success)
                            .frame(width: 16, height: 16)
                        Text("Aktivní")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(AppColors.success)
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(AppColors.success.opacity(0.15))
                    .cornerRadius(25)
                }
            } else {
                // No active barrels placeholder
                VStack(spacing: 20) {
                    Image(systemName: "cylinder.slash")
                        .font(.system(size: 80))
                        .foregroundColor(.gray)
                    Text("Žádný aktivní sud")
                        .font(.title)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(20)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }
    
    // iPad: List of active barrels with enhanced styling
    private func activeBarrelsList(barrels: [Barrel]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Aktivní sudy")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
            
            LazyVStack(spacing: 16) {
                ForEach(barrels) { barrel in
                    activeBarrelCard(barrel: barrel)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    // Enhanced barrel card for both iPhone and iPad
    private func activeBarrelCard(barrel: Barrel) -> some View {
        VStack(spacing: 12) {
            CircularProgressView(
                progress: barrel.remainingPercentage / 100.0,
                total: barrel.totalBeers,
                current: barrel.remainingBeers,
                size: barrel.size
            )
            .scaleEffect(UIDevice.current.userInterfaceIdiom == .pad ? 1.1 : 1.0)
            
            // Enhanced status indicator
            HStack(spacing: 8) {
                Circle()
                    .fill(AppColors.success)
                    .frame(width: UIDevice.current.userInterfaceIdiom == .pad ? 10 : 8, height: UIDevice.current.userInterfaceIdiom == .pad ? 10 : 8)
                Text("Aktivní")
                    .font(UIDevice.current.userInterfaceIdiom == .pad ? .subheadline : .caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, UIDevice.current.userInterfaceIdiom == .pad ? 12 : 8)
        }
        .padding(UIDevice.current.userInterfaceIdiom == .pad ? 20 : 16)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
    
    // Enhanced barrel card for iPad grid layout
    private func enhancedBarrelCard(barrel: Barrel) -> some View {
        VStack(spacing: 16) {
            // Enhanced barrel icon with status
            ZStack {
                Image(systemName: "cylinder.fill")
                    .font(.system(size: 40))
                    .foregroundColor(barrel.isActive ? AppColors.success : .gray)
                
                if barrel.isActive {
                    Circle()
                        .fill(AppColors.success)
                        .frame(width: 12, height: 12)
                        .offset(x: 15, y: -15)
                }
            }
            
            // Barrel info
            VStack(spacing: 8) {
                Text("\(barrel.size)L")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(barrel.isActive ? "Aktivní" : "Neaktivní")
                    .font(.subheadline)
                    .foregroundColor(barrel.isActive ? AppColors.success : .secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(barrel.isActive ? AppColors.success.opacity(0.15) : Color.gray.opacity(0.1))
                    )
            }
            
            // Beer count
            VStack(spacing: 4) {
                Text("\(barrel.remainingBeers)/\(barrel.totalBeers)")
                    .font(.title3)
                    .fontWeight(.bold)
                Text("piv")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
                .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 3)
        )
    }
    
    // Standard barrel row for iPhone list layout
    private func standardBarrelRow(barrel: Barrel) -> some View {
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

#Preview {
    BarrelsView()
} 
