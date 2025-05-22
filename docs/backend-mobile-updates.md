# Backend Mobile Support Updates

This document outlines the necessary changes to the backend to fully support the Swift admin UI.

## Required Changes

### 1. API Versioning
- [ ] Add API version header support
  - [ ] Implement version middleware
  - [ ] Add version to response headers
  - [ ] Document versioning scheme
  - [ ] Handle version compatibility

### 2. Response Optimization
- [ ] Enhance response format
  - [ ] Add pagination metadata
  - [ ] Optimize payload size
  - [ ] Include resource URLs
  - [ ] Add response compression
  - [ ] Implement field selection

### 3. Mobile Authentication
- [ ] Add device management
  - [ ] Store device tokens
  - [ ] Handle multiple devices
  - [ ] Implement device verification
  - [ ] Add device-specific refresh tokens
  - [ ] Support biometric authentication flags

### 4. Push Notifications
- [ ] Implement notification system
  - [ ] Add Apple Push Notification service (APNs) support
  - [ ] Create notification templates
  - [ ] Add notification preferences
  - [ ] Implement notification queue
  - [ ] Add notification history

### 5. Rate Limiting
- [ ] Add mobile-specific rate limiting
  - [ ] Configure limits per endpoint
  - [ ] Add device-based limiting
  - [ ] Implement retry-after headers
  - [ ] Add rate limit monitoring

### 6. Offline Support
- [ ] Add sync endpoints
  - [ ] Implement delta updates
  - [ ] Add last-modified tracking
  - [ ] Support batch operations
  - [ ] Handle conflict resolution
  - [ ] Add sync status endpoints

### 7. Error Handling
- [ ] Enhance error responses
  - [ ] Add detailed error codes
  - [ ] Include recovery suggestions
  - [ ] Add error localization
  - [ ] Implement validation details
  - [ ] Add debug information (dev only)

### 8. Security Enhancements
- [ ] Add mobile security features
  - [ ] Implement certificate pinning
  - [ ] Add device verification
  - [ ] Enhance token security
  - [ ] Add request signing
  - [ ] Implement IP allowlisting

## Database Updates

### 1. Device Management
```typescript
@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  deviceToken: string;

  @Column()
  deviceType: string;

  @Column()
  deviceName: string;

  @Column()
  lastActive: Date;

  @Column({ nullable: true })
  pushToken: string;

  @Column({ default: true })
  pushEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Notification Management
```typescript
@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Device, { nullable: true })
  device: Device;

  @Column()
  type: string;

  @Column('json')
  payload: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

## API Updates

### New Endpoints
1. Device Management
   - `POST /api/v1/devices` - Register device
   - `DELETE /api/v1/devices/:id` - Remove device
   - `PATCH /api/v1/devices/:id` - Update device settings

2. Push Notifications
   - `POST /api/v1/notifications/register` - Register for push
   - `GET /api/v1/notifications` - Get notifications
   - `PATCH /api/v1/notifications/:id` - Mark as read

3. Sync
   - `GET /api/v1/sync/status` - Get sync status
   - `POST /api/v1/sync/batch` - Batch operations
   - `GET /api/v1/sync/changes` - Get changes since timestamp

### Modified Endpoints
All existing endpoints need updates for:
- Pagination headers
- Version headers
- Rate limit headers
- Compression support
- Field selection
- Error enhancement

## Implementation Priority

### Phase 1 (Essential)
1. API versioning
2. Response optimization
3. Basic device management
4. Enhanced error handling

### Phase 2 (Important)
1. Push notification system
2. Rate limiting
3. Advanced device management
4. Security enhancements

### Phase 3 (Optional)
1. Offline support
2. Advanced sync features
3. Analytics tracking
4. Performance optimization

## Notes
- All changes should maintain backward compatibility
- Consider impact on existing web client
- Document all new features and changes
- Add appropriate tests for new functionality
- Monitor performance impact of changes 