import SwiftUI

struct AddParticipantDialog: View {
    @Binding var isPresented: Bool
    @State private var username = ""
    @State private var selectedGender = Gender.MALE
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showError = false
    
    let onAdd: (CreateParticipant) async -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            // Handle bar
            RoundedRectangle(cornerRadius: 2.5)
                .fill(Color.secondary.opacity(0.3))
                .frame(width: 36, height: 5)
                .padding(.top, 8)
            
            Text("Add New Participant")
                .font(.title2.bold())
            
            // Form Fields
            VStack(alignment: .leading, spacing: 16) {
                // Username field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Username")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    TextField("Enter username", text: $username)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                }
                
                // Gender picker
                VStack(alignment: .leading, spacing: 8) {
                    Text("Gender")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Picker("Gender", selection: $selectedGender) {
                        ForEach(Gender.allCases, id: \.self) { gender in
                            Text(gender.displayName)
                                .tag(gender)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }
            .padding(.horizontal)
            
            Spacer()
            
            // Add Button
            Button(action: {
                Task {
                    await addParticipant()
                }
            }) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                } else {
                    Text("Add Participant")
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(username.isEmpty ? Color.blue.opacity(0.5) : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }
            .disabled(isLoading || username.isEmpty)
            .padding(.horizontal)
            
            // Cancel button
            Button("Cancel", role: .cancel) {
                isPresented = false
            }
            .padding(.bottom)
        }
        .padding(.top)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(16)
        .presentationDetents([.height(400)])
        .presentationDragIndicator(.visible)
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            if let apiError = error as? APIError {
                Text(apiError.description)
            } else {
                Text(error?.localizedDescription ?? "An unknown error occurred")
            }
        }
    }
    
    private func addParticipant() async {
        guard !username.isEmpty else { return }
        
        isLoading = true
        do {
            let participant = CreateParticipant(
                username: username,
                gender: selectedGender
            )
            await onAdd(participant)
            isPresented = false
        } catch {
            self.error = error
            showError = true
        }
        isLoading = false
    }
}

#Preview {
    AddParticipantDialog(isPresented: .constant(true)) { participant in
        print("Adding participant: \(participant.username), Gender: \(participant.gender)")
    }
} 