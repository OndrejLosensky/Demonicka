//
//  ContentView.swift
//  Demonicka
//
//  Created by Ondřej Losenský on 16.06.2025.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Image(systemName: "chart.bar.fill")
                    Text("Dashboard")
                }
            
            ParticipantsView()
                .tabItem {
                    Image(systemName: "person.3.fill")
                    Text("Participants")
                }
            
            EventsView()
                .tabItem {
                    Image(systemName: "calendar.circle.fill")
                    Text("Events")
                }
            
            BarrelsView()
                .tabItem {
                    Image(systemName: "cylinder.fill")
                    Text("Barrels")
                }
        }
    }
}

struct DashboardView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Compact Header
                    VStack(spacing: 4) {
                        Text("Démonická")
                            .font(.title)
                            .fontWeight(.bold)
                        Text("Mobile Admin Panel")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 8)
                    
                    // Compact Admin Cards Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        CompactAdminCard(
                            title: "Participants",
                            icon: "person.3.fill",
                            color: .blue,
                            count: "24"
                        )
                        
                        CompactAdminCard(
                            title: "Events",
                            icon: "calendar.circle.fill",
                            color: .green,
                            count: "3"
                        )
                        
                        CompactAdminCard(
                            title: "Barrels",
                            icon: "cylinder.fill",
                            color: .orange,
                            count: "8"
                        )
                        
                        CompactAdminCard(
                            title: "Beers Served",
                            icon: "cup.and.saucer.fill",
                            color: .brown,
                            count: "156"
                        )
                    }
                    .padding(.horizontal)
                    
                    // Compact Quick Actions
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Quick Actions")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .padding(.horizontal)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 10) {
                            QuickActionCard(
                                title: "Add Participant",
                                icon: "person.badge.plus",
                                color: .blue
                            )
                            
                            QuickActionCard(
                                title: "Create Event",
                                icon: "plus.circle",
                                color: .green
                            )
                            
                            QuickActionCard(
                                title: "Add Barrel",
                                icon: "plus.rectangle.on.rectangle",
                                color: .orange
                            )
                            
                            QuickActionCard(
                                title: "Statistics",
                                icon: "chart.bar.fill",
                                color: .purple
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Live Status Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Live Status")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .padding(.horizontal)
                        
                        VStack(spacing: 6) {
                            LiveStatusRow(
                                icon: "checkmark.circle.fill",
                                title: "Summer Festival Active",
                                subtitle: "24 participants online",
                                color: .green
                            )
                            
                            LiveStatusRow(
                                icon: "cylinder.fill",
                                title: "3 Barrels Active",
                                subtitle: "Pilsner, Budvar, Kozel",
                                color: .orange
                            )
                            
                            LiveStatusRow(
                                icon: "clock.fill",
                                title: "Last Beer: 2 min ago",
                                subtitle: "Jan Novák - Pilsner Urquell",
                                color: .blue
                            )
                        }
                        .background(Color(UIColor.systemBackground))
                        .cornerRadius(10)
                        .shadow(color: .gray.opacity(0.1), radius: 3, x: 0, y: 1)
                        .padding(.horizontal)
                    }
                    
                    Spacer(minLength: 16)
                }
                .padding(.bottom, 8)
            }
            .navigationBarHidden(true)
            .background(Color(UIColor.systemGroupedBackground))
        }
    }
}

struct CompactAdminCard: View {
    let title: String
    let icon: String
    let color: Color
    let count: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            
            Text(count)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(height: 90)
        .frame(maxWidth: .infinity)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: .gray.opacity(0.1), radius: 3, x: 0, y: 1)
    }
}

struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(color)
                .frame(width: 24)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.primary)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(8)
        .shadow(color: .gray.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

struct LiveStatusRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(color)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }
}

#Preview {
    ContentView()
}
