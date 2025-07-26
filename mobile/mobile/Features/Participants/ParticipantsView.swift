import SwiftUI

struct ParticipantsView: View {
    @State private var participants: [Participant] = []
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showingError = false
    @State private var showingAddDialog = false
    @State private var processingUserId: String?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading && participants.isEmpty {
                    ProgressView("Loading participants...")
                } else {
                    List {
                        ForEach(participants) { participant in
                            ParticipantRow(
                                participant: participant,
                                isProcessing: processingUserId == participant.id,
                                onAddBeer: {
                                    Task {
                                        await handleAddBeer(for: participant)
                                    }
                                },
                                onRemoveBeer: {
                                    Task {
                                        await handleRemoveBeer(for: participant)
                                    }
                                }
                            )
                        }
                    }
                    .refreshable {
                        await loadParticipants()
                    }
                }
            }
            .navigationTitle("Participants")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddDialog = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddDialog) {
                AddParticipantDialog(isPresented: $showingAddDialog) { participant in
                    Task {
                        await handleAddParticipant(participant)
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
                Button("Retry") {
                    Task {
                        await loadParticipants()
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
                await loadParticipants()
            }
        }
    }
    
    private func loadParticipants() async {
        isLoading = true
        error = nil
        
        do {
            participants = try await ParticipantService.shared.fetchParticipants()
        } catch {
            self.error = error
            showingError = true
        }
        
        isLoading = false
    }
    
    private func handleAddParticipant(_ participant: CreateParticipant) async {
        do {
            try await ParticipantService.shared.createParticipant(participant)
            await loadParticipants()
        } catch {
            self.error = error
            showingError = true
        }
    }
    
    private func handleAddBeer(for participant: Participant) async {
        guard processingUserId == nil else { return }
        processingUserId = participant.id
        
        do {
            try await ParticipantService.shared.addBeer(userId: participant.id)
            await loadParticipants()
        } catch {
            self.error = error
            showingError = true
        }
        
        processingUserId = nil
    }
    
    private func handleRemoveBeer(for participant: Participant) async {
        guard processingUserId == nil else { return }
        processingUserId = participant.id
        
        do {
            try await ParticipantService.shared.removeBeer(userId: participant.id)
            await loadParticipants()
        } catch {
            self.error = error
            showingError = true
        }
        
        processingUserId = nil
    }
}

struct ParticipantRow: View {
    let participant: Participant
    let isProcessing: Bool
    let onAddBeer: () -> Void
    let onRemoveBeer: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(participant.username)
                    .font(.headline)
                HStack {
                    Text("\(participant.eventBeerCount) beers")
                        .foregroundColor(.secondary)
                    if let lastBeer = participant.lastBeerTime {
                        Text("• Last: \(lastBeer.formatted(.relative(presentation: .named)))")
                            .foregroundColor(.secondary)
                            .font(.subheadline)
                    }
                }
            }
            
            Spacer()
            
            if isProcessing {
                ProgressView()
                    .scaleEffect(0.8)
            } else {
                HStack(spacing: 12) {
                    // Remove beer button
                    Button {
                        onRemoveBeer()
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .foregroundColor(.red)
                            .font(.title2)
                            .frame(width: 44, height: 44)
                    }
                    .disabled(participant.eventBeerCount == 0)
                    
                    // Add beer button
                    Button {
                        onAddBeer()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.green)
                            .font(.title2)
                            .frame(width: 44, height: 44)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Button Components
struct RemoveButton: View {
    let isEnabled: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: "minus.circle.fill")
                .foregroundColor(isEnabled ? .red : .gray)
                .font(.title2)
        }
        .buttonStyle(BeerButtonStyle())
        .disabled(!isEnabled)
    }
}

struct AddButton: View {
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: "plus.circle.fill")
                .foregroundColor(.green)
                .font(.title2)
        }
        .buttonStyle(BeerButtonStyle())
    }
}

struct BeerButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(width: 44, height: 44)
            .contentShape(Rectangle())
            .opacity(configuration.isPressed ? 0.7 : 1.0)
    }
}

struct ParticipantsView_Previews: PreviewProvider {
    static var previews: some View {
        ParticipantsView()
    }
} 