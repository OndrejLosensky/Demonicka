import SwiftUI

struct BarrelsView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Stats Header
                    HStack(spacing: 15) {
                        BarrelStatCard(title: "Total Barrels", value: "8", color: .blue)
                        BarrelStatCard(title: "Active", value: "3", color: .green)
                        BarrelStatCard(title: "Empty", value: "2", color: .red)
                    }
                    .padding(.horizontal)
                    
                    // Active Barrels
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Active Barrels")
                                .font(.headline)
                            Spacer()
                            Button("Add New") {
                                // TODO: Add new barrel
                            }
                            .font(.caption)
                            .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            BarrelCard(
                                name: "Pilsner Urquell",
                                volume: 50.0,
                                remaining: 35.0,
                                isActive: true,
                                status: BarrelStatus.active
                            )
                            
                            BarrelCard(
                                name: "Budweiser Budvar",
                                volume: 50.0,
                                remaining: 42.0,
                                isActive: true,
                                status: BarrelStatus.active
                            )
                            
                            BarrelCard(
                                name: "Kozel Dark",
                                volume: 30.0,
                                remaining: 18.0,
                                isActive: true,
                                status: BarrelStatus.active
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Other Barrels
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Other Barrels")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            BarrelCard(
                                name: "Bernard Dark",
                                volume: 50.0,
                                remaining: 0.0,
                                isActive: false,
                                status: BarrelStatus.empty
                            )
                            
                            BarrelCard(
                                name: "Staropramen",
                                volume: 30.0,
                                remaining: 30.0,
                                isActive: false,
                                status: BarrelStatus.standby
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
                .padding(.top)
            }
            .navigationTitle("Barrels")
            .background(Color(UIColor.systemGroupedBackground))
        }
    }
}



struct BarrelCard: View {
    let name: String
    let volume: Double
    let remaining: Double
    let isActive: Bool
    let status: BarrelStatus
    
    var fillPercentage: Double {
        volume > 0 ? remaining / volume : 0
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text("\(Int(remaining))L / \(Int(volume))L")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(status.text)
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(status.color)
                    .foregroundColor(.white)
                    .cornerRadius(6)
            }
            
            // Progress Bar
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Fill Level")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(Int(fillPercentage * 100))%")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(status.color)
                }
                
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 8)
                        
                        Rectangle()
                            .fill(status.color)
                            .frame(width: geometry.size.width * fillPercentage, height: 8)
                    }
                    .cornerRadius(4)
                }
                .frame(height: 8)
            }
            
            HStack {
                Button(isActive ? "Deactivate" : "Activate") {
                    // TODO: Toggle barrel status
                }
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isActive ? Color.red.opacity(0.1) : Color.green.opacity(0.1))
                .foregroundColor(isActive ? .red : .green)
                .cornerRadius(8)
                
                Spacer()
                
                if status == BarrelStatus.empty {
                    Button("Replace") {
                        // TODO: Replace barrel
                    }
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
                }
            }
        }
        .padding(16)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: .gray.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct BarrelStatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(10)
        .shadow(color: .gray.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

#Preview {
    BarrelsView()
} 