import SwiftUI

struct EventsView: View {
    @State private var events: [EventModel] = []
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showingError = false
    @State private var selectedEvent: EventModel?
    
    var body: some View {
        print("🎯 EventsView body is being rendered") // Debug print
        
        return NavigationView {
            Group {
                if isLoading && events.isEmpty {
                    ProgressView("Loading events...")
                } else if events.isEmpty {
                    ContentUnavailableView(
                        "No Events Found",
                        systemImage: "calendar.badge.exclamationmark",
                        description: Text("There are no events available.")
                    )
                } else {
                    List {
                        ForEach(events) { event in
                            EventRow(event: event)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    print("🔍 Selected event: \(event.name)")
                                    selectedEvent = event
                                }
                        }
                    }
                    .refreshable {
                        print("🔄 Refreshing events list...")
                        await loadEvents()
                    }
                }
            }
            .navigationTitle("Events")
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
                Button("Retry") {
                    Task {
                        await loadEvents()
                    }
                }
            } message: {
                if let apiError = error as? APIError {
                    Text(apiError.description)
                } else {
                    Text(error?.localizedDescription ?? "An unknown error occurred")
                }
            }
            .sheet(item: $selectedEvent) { event in
                NavigationView {
                    EventDetailView(event: event, isPresented: $selectedEvent)
                }
            }
            .task {
                print("🚀 EventsView task started")
                await loadEvents()
            }
            .onAppear {
                print("👋 EventsView appeared")
                Task {
                    print("📱 Starting initial events load")
                    await loadEvents()
                }
            }
        }
    }
    
    private func loadEvents() async {
        print("🎯 Starting to load events...")
        isLoading = true
        error = nil
        
        do {
            print("📡 Calling EventService.fetchEvents()")
            events = try await EventService.shared.fetchEvents()
            print("✅ Successfully loaded \(events.count) events")
            
            if events.isEmpty {
                print("⚠️ No events returned from API")
            } else {
                print("📊 Events summary:")
                events.forEach { event in
                    print("""
                          - \(event.name)
                            Active: \(event.isActive ? "Yes" : "No")
                            Date: \(event.formattedDateRange)
                          """)
                }
            }
        } catch {
            print("❌ Error loading events: \(error)")
            if let apiError = error as? APIError {
                print("📝 API Error details: \(apiError.description)")
            }
            self.error = error
            showingError = true
        }
        
        isLoading = false
        print("🏁 Finished loading events")
    }
}

struct EventRow: View {
    let event: EventModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(event.name)
                    .font(.headline)
                if event.isActive {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                        .font(.caption)
                }
            }
            
            if let description = event.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Text(event.formattedDateRange)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct EventDetailView: View {
    let event: EventModel
    @Binding var isPresented: EventModel?
    
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    if event.isActive {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                            Text("Active Event")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if let description = event.description {
                        Text(description)
                            .font(.body)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(.blue)
                            Text("Start: \(event.startDate.formatted())")
                        }
                        
                        if let endDate = event.endDate {
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundColor(.red)
                                Text("End: \(endDate.formatted())")
                            }
                        }
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                }
            }
            
            Section("Event Information") {
                LabeledContent("Created", value: event.createdAt.formatted())
                LabeledContent("Updated", value: event.updatedAt.formatted())
                if let deletedAt = event.deletedAt {
                    LabeledContent("Deleted", value: deletedAt.formatted())
                }
            }
        }
        .navigationTitle(event.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    print("👋 Dismissing event detail for: \(event.name)")
                    isPresented = nil
                }
            }
        }
        .onAppear {
            print("""
                  📅 Showing event detail:
                     Name: \(event.name)
                     Active: \(event.isActive)
                     Start: \(event.startDate.formatted())
                     End: \(event.endDate?.formatted() ?? "Ongoing")
                     Description: \(event.description ?? "No description")
                  """)
        }
    }
}

#Preview {
    EventsView()
} 
