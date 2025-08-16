import SwiftUI

struct AddBarrelDialog: View {
    @Binding var isPresented: Bool
    @State private var selectedSize: Int = 50
    @State private var isLoading = false
    @State private var error: Error?
    @State private var showError = false
    
    let onAdd: (Int) async -> Void
    
    private let availableSizes = [15, 30, 50]
    
    var body: some View {
        VStack(spacing: 20) {
            // Handle bar
            RoundedRectangle(cornerRadius: 2.5)
                .fill(Color.secondary.opacity(0.3))
                .frame(width: 36, height: 5)
                .padding(.top, 8)
            
            Text("Přidat další sud")
                .font(.title2.bold())
            
            // Size Picker
            VStack(alignment: .leading, spacing: 12) {
                Text("Velkost")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Picker("Size", selection: $selectedSize) {
                    ForEach(availableSizes, id: \.self) { size in
                        Text("\(size)L")
                            .tag(size)
                    }
                }
                .pickerStyle(.segmented)
            }
            .padding(.horizontal)
            
            // Add Button
            Button(action: {
                Task {
                    await addBarrel()
                }
            }) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                } else {
                    Text("Přidat")
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }
            .disabled(isLoading)
            .padding(.horizontal)
            
            // Cancel button
            Button("Zrušit", role: .cancel) {
                isPresented = false
            }
            .padding(.bottom)
        }
        .padding(.top)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(16)
        .frame(height: 300)
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
    
    private func addBarrel() async {
        isLoading = true
        do {
            await onAdd(selectedSize)
            isPresented = false
        } catch {
            self.error = error
            showError = true
        }
        isLoading = false
    }
}

#Preview {
    AddBarrelDialog(isPresented: .constant(true)) { size in
        print("Adding barrel: \(size)L")
    }
} 
