import SwiftUI

struct CustomTextField: View {
    let placeholder: String
    let text: Binding<String>
    let isSecure: Bool
    let icon: String
    
    init(_ placeholder: String, text: Binding<String>, isSecure: Bool = false, icon: String) {
        self.placeholder = placeholder
        self.text = text
        self.isSecure = isSecure
        self.icon = icon
    }
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 20)
            
            if isSecure {
                SecureField(placeholder, text: text)
            } else {
                TextField(placeholder, text: text)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
} 