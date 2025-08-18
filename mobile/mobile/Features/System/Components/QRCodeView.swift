import SwiftUI

struct QRCodeView: View {
    let token: String
    let size: CGFloat
    
    init(token: String, size: CGFloat = 200) {
        self.token = token
        self.size = size
    }
    
    var body: some View {
        VStack(spacing: 16) {
            if let qrCodeImage = QRCodeGenerator.generateQRCode(
                from: QRCodeGenerator.generateRegistrationURL(from: token),
                size: size
            ) {
                Image(uiImage: qrCodeImage)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(width: size, height: size)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(radius: 4)
            } else {
                // Fallback if QR code generation fails
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: size, height: size)
                    .overlay(
                        VStack {
                            Image(systemName: "qrcode")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                            Text("QR Code Error")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    )
            }
            
            // Show the registration URL
            VStack(spacing: 8) {
                Text("Registrační odkaz")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(QRCodeGenerator.generateRegistrationURL(from: token))
                    .font(.caption2)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
        }
    }
}

#Preview {
    QRCodeView(token: "TestUser#1234")
        .padding()
}
