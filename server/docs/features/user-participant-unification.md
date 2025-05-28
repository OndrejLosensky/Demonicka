# User-Participant Unification Design

## Overview
This document outlines the architectural changes needed to unify the User and Participant systems into a single entity. This change will improve data consistency, simplify the codebase, and provide a better user experience.

## Current System
Currently, the system maintains two separate entities:
- **Users**: Authenticated users with login credentials
- **Participants**: Event participants who can consume beers but don't have login access

## New Design

### Core Concept
- All participants will become users in the system
- Participants created during events will be "incomplete" users until they finish registration
- Each user can have different states (complete/incomplete registration)
- Beer consumption history and event participation will be tied directly to the user

### Entity Changes

#### User Entity Additions
```typescript
@Entity('users')
export class User {
  // Existing fields remain...

  // New fields
  @Column({ nullable: true, unique: true })
  registrationToken: string | null;

  @Column({ default: false })
  isRegistrationComplete: boolean;

  @Column()
  gender: 'MALE' | 'FEMALE';

  @Column({ default: 0 })
  beerCount: number;

  @Column({ nullable: true })
  lastBeerTime: Date | null;

  // Relationships
  @OneToMany(() => Beer, beer => beer.user)
  beers: Beer[];
}
```

### Registration Flow
1. **Complete Registration (Normal Flow)**
   - User registers through the application
   - Provides all required information
   - Account is marked as complete
   - Can immediately log in

2. **Incomplete Registration (Event Participant Flow)**
   - Admin creates a participant during an event
   - System creates a user with:
     - Required fields (name, gender)
     - Generated unique registration token
     - `isRegistrationComplete = false`
   - Participant receives a unique registration link
   - Upon accessing the link, they complete registration by adding:
     - Email
     - Password
     - Any additional required information

### API Changes

#### New Endpoints
- `POST /auth/complete-registration`
  - Completes registration for incomplete users
  - Requires registration token
  - Sets email, password, and marks registration as complete

#### Modified Endpoints
- `POST /participants`
  - Will be modified to create incomplete users
  - Generates registration token
  - Returns registration completion URL

#### Deprecated Endpoints
- Several participant-specific endpoints will be deprecated
- Migration path will be provided for existing integrations

### Database Migration Plan
1. Create new fields in users table
2. Migrate existing participants to users table
3. Update relationships in related tables (beers, events)
4. Add necessary indexes and constraints
5. Implement rollback strategy

### Security Considerations
- Registration tokens must be securely generated and unique
- Tokens should have expiration time
- Incomplete users cannot access authenticated endpoints
- Rate limiting on registration completion endpoint

### Frontend Changes
1. Update participant creation forms
2. Add registration completion flow
3. Modify participant lists to show registration status
4. Update beer tracking to work with unified user system

### Testing Strategy
1. Unit tests for new user states
2. Integration tests for registration flows
3. Migration testing with production-like data
4. Security testing for registration completion

## Implementation Phases

### Phase 1: Foundation
- Create database migration
- Update User entity
- Add registration token generation
- Update authentication system

### Phase 2: API Updates
- Implement new endpoints
- Modify existing endpoints
- Add validation and security measures

### Phase 3: Frontend
- Update UI components
- Implement registration completion flow
- Update participant management

### Phase 4: Migration
- Create data migration scripts
- Test with production data backup
- Plan deployment strategy

### Phase 5: Cleanup
- Remove deprecated code
- Update documentation
- Monitor system performance

## Risks and Mitigation
1. **Data Loss Risk**
   - Backup all data before migration
   - Run test migrations on production copy
   - Implement rollback procedures

2. **Performance Impact**
   - Index new fields appropriately
   - Monitor query performance
   - Optimize if needed

3. **User Experience**
   - Clear communication about changes
   - Simple registration completion process
   - Support for bulk participant creation

## Future Considerations
- Enhanced user roles and permissions
- Additional user states/flags
- Integration with external authentication systems
- Analytics for registration completion rates

## Questions to Resolve
- Token expiration policy
- Handling of inactive/incomplete users
- Bulk participant creation process
- Migration timeline and strategy 