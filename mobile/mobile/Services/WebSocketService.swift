import Foundation
import Combine

class WebSocketService: ObservableObject {
    static let shared = WebSocketService()
    
    @Published var isConnected = false
    @Published var connectionStatus: ConnectionStatus = .disconnected
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession
    private var reconnectTimer: Timer?
    private var heartbeatTimer: Timer?
    private let reconnectInterval: TimeInterval = 5.0
    private let heartbeatInterval: TimeInterval = 30.0
    
    enum ConnectionStatus {
        case disconnected
        case connecting
        case connected
        case reconnecting
    }
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        session = URLSession(configuration: config)
    }
    
    func connect() {
        guard webSocket == nil else { return }
        
        connectionStatus = .connecting
        
        // Construct WebSocket URL from the existing API config
        let wsURLString = "\(Config.baseURL.replacingOccurrences(of: "https://", with: "wss://").replacingOccurrences(of: "http://", with: "ws://"))\(Config.API.prefix)/socket.io/?EIO=4&transport=websocket"
        
        guard let url = URL(string: wsURLString) else {
            print("❌ Invalid WebSocket URL: \(wsURLString)")
            connectionStatus = .disconnected
            return
        }
        
        print("🔌 Connecting to WebSocket: \(url)")
        
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = Config.API.headers
        
        webSocket = session.webSocketTask(with: request)
        webSocket?.resume()
        
        // Start listening for messages
        receiveMessage()
        
        // Send initial connection message
        sendMessage("40")
        
        // Start heartbeat
        startHeartbeat()
    }
    
    func disconnect() {
        print("🔌 Disconnecting WebSocket")
        
        stopHeartbeat()
        stopReconnectTimer()
        
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        
        connectionStatus = .disconnected
        isConnected = false
    }
    
    func joinEvent(_ eventId: String) {
        let joinMessage = "42[\"event:join\",{\"eventId\":\"\(eventId)\"}]"
        sendMessage(joinMessage)
        print("🔌 Joined event room: \(eventId)")
    }
    
    func leaveEvent(_ eventId: String) {
        let leaveMessage = "42[\"event:leave\",{\"eventId\":\"\(eventId)\"}]"
        sendMessage(leaveMessage)
        print("🔌 Left event room: \(eventId)")
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let message):
                    self?.handleMessage(message)
                    // Continue listening
                    self?.receiveMessage()
                case .failure(let error):
                    print("❌ WebSocket receive error: \(error)")
                    self?.handleConnectionError(error)
                }
            }
        }
    }
    
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            print("📨 WebSocket message: \(text)")
            
            // Handle Socket.IO protocol messages
            if text == "2" {
                // Ping response, send pong
                sendMessage("3")
            } else if text.hasPrefix("40") {
                // Connected
                connectionStatus = .connected
                isConnected = true
                print("✅ WebSocket connected")
                stopReconnectTimer()
            } else if text.hasPrefix("42") {
                // Application message
                handleApplicationMessage(text)
            } else if text.hasPrefix("41") {
                // Disconnected
                connectionStatus = .disconnected
                isConnected = false
                print("❌ WebSocket disconnected by server")
                scheduleReconnect()
            }
            
        case .data(let data):
            if let text = String(data: data, encoding: .utf8) {
                print("📨 WebSocket data message: \(text)")
                handleMessage(.string(text))
            }
            
        @unknown default:
            print("❓ Unknown WebSocket message type")
        }
    }
    
    private func handleApplicationMessage(_ message: String) {
        // Extract the actual message content from Socket.IO format
        // Format: "42["eventName", data]"
        guard message.hasPrefix("42[") && message.hasSuffix("]") else { return }
        
        let content = String(message.dropFirst(3).dropLast(1))
        
        // Parse event name and data
        if let eventStart = content.firstIndex(of: "\""),
           let eventEnd = content[eventStart...].dropFirst().firstIndex(of: "\""),
           let dataStart = content[eventEnd...].dropFirst().firstIndex(of: ",") {
            
            let eventName = String(content[content.index(after: eventStart)..<eventEnd])
            let dataString = String(content[dataStart...].dropFirst().trimmingCharacters(in: .whitespaces))
            
            print("📨 Event: \(eventName), Data: \(dataString)")
            
            // Handle specific events
            switch eventName {
            case "leaderboard:update":
                NotificationCenter.default.post(name: .leaderboardUpdated, object: nil)
            case "dashboard:update":
                NotificationCenter.default.post(name: .dashboardUpdated, object: nil)
            default:
                print("📨 Unknown event: \(eventName)")
            }
        }
    }
    
    private func handleConnectionError(_ error: Error) {
        print("❌ WebSocket connection error: \(error)")
        
        connectionStatus = .disconnected
        isConnected = false
        
        // Schedule reconnection
        scheduleReconnect()
    }
    
    private func sendMessage(_ message: String) {
        webSocket?.send(.string(message)) { [weak self] error in
            if let error = error {
                print("❌ Failed to send WebSocket message: \(error)")
                self?.handleConnectionError(error)
            }
        }
    }
    
    private func startHeartbeat() {
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: heartbeatInterval, repeats: true) { [weak self] _ in
            self?.sendMessage("2") // Ping
        }
    }
    
    private func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
    }
    
    private func scheduleReconnect() {
        guard connectionStatus != .reconnecting else { return }
        
        connectionStatus = .reconnecting
        stopReconnectTimer()
        
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: reconnectInterval, repeats: false) { [weak self] _ in
            self?.connect()
        }
    }
    
    private func stopReconnectTimer() {
        reconnectTimer?.invalidate()
        reconnectTimer = nil
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let leaderboardUpdated = Notification.Name("leaderboardUpdated")
    static let dashboardUpdated = Notification.Name("dashboardUpdated")
}
