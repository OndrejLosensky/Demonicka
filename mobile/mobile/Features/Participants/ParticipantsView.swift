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
                    ProgressView("Načítám účastníky...")
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
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
                                .padding(.horizontal)
                                .padding(.vertical, 4)
                                
                                if participant.id != participants.last?.id {
                                    Divider()
                                        .padding(.horizontal)
                                }
                            }
                        }
                    }
                    .refreshable {
                        await loadParticipants()
                    }
                }
            }
            .navigationTitle("Účastníci")
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
                Button("Opakovat") {
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
        
        print("🔄 Adding beer for participant: \(participant.username) (ID: \(participant.id))")
        print("📊 Current beer count: \(participant.eventBeerCount)")
        
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
        
        print("🔄 Removing beer for participant: \(participant.username) (ID: \(participant.id))")
        print("📊 Current beer count: \(participant.eventBeerCount)")
        
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
                    Text("\(participant.eventBeerCount) piv")
                        .foregroundColor(.secondary)
                    if let lastBeer = participant.lastBeerTime {
                        Text("• \(lastBeer.formatted(.relative(presentation: .named)))")
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
                        print("🔴 Remove button pressed for: \(participant.username)")
                        onRemoveBeer()
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .foregroundColor(AppColors.error)
                            .font(.title2)
                            .frame(width: 44, height: 44)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(participant.eventBeerCount == 0)
                    .opacity(participant.eventBeerCount == 0 ? 0.5 : 1.0)
                    .contentShape(Rectangle())
                    
                    // Add beer button
                    Button {
                        print("🟢 Add button pressed for: \(participant.username)")
                        onAddBeer()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(AppColors.success)
                            .font(.title2)
                            .frame(width: 44, height: 44)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .contentShape(Rectangle())
                    

                }
            }
        }
    }
}

// MARK: - Button Components
struct RemoveButton: View {
    let isEnabled: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: "minus.circle.fill")
                .foregroundColor(isEnabled ? AppColors.error : .gray)
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
                .foregroundColor(AppColors.success)
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
