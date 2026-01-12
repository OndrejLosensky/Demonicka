import SwiftUI
import CoreImage
import CoreImage.CIFilterBuiltins

struct QRCodeGenerator {
    static func generateQRCode(from string: String, size: CGFloat = 200) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M" // Medium error correction
        
        guard let outputImage = filter.outputImage else { return nil }
        
        let scaleX = size / outputImage.extent.width
        let scaleY = size / outputImage.extent.height
        let scaledImage = outputImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
        
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else { return nil }
        
        return UIImage(cgImage: cgImage)
    }
    
    static func generateRegistrationURL(from token: String) -> String {
        // Generate URL that goes to the frontend registration page
        let baseURL = "https://demonicka.losensky.cloud"
        return "\(baseURL)/complete-registration?token=\(token)"
    }
}
