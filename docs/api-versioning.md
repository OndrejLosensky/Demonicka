# API Versioning Documentation

## Overview
This document describes the API versioning system implemented in our backend service.

## Version Format
- Versions are specified using simple numeric values (e.g., "1", "2")
- The current latest version is "1"
- Versions are specified using the `X-API-Version` header

## Version Headers
### Request Headers
- `X-API-Version`: Specifies the requested API version
  - Optional
  - If not provided, defaults to version "1"
  - Example: `X-API-Version: 1`

### Response Headers
- `X-API-Version`: Indicates the version used to process the request
  - Always included in responses
  - Matches the version used to process the request
  - Example: `X-API-Version: 1`

## Version Support
- Each endpoint can support multiple versions
- Deprecated versions are marked in the version configuration
- Sunset dates for deprecated versions will be announced in advance

## Usage in Code
### Decorators
Use the `@Versions` decorator to specify supported versions for a route:
```typescript
@Versions('1', '2')
@Get('/users')
getUsers() {
  // This endpoint supports both v1 and v2
}
```

### Version Guard
The `VersionGuard` automatically checks if:
- The requested version exists
- The version is not deprecated
- The endpoint supports the requested version

## Error Handling
- Invalid version: 400 Bad Request
- Deprecated version: 410 Gone
- Unsupported version: 406 Not Acceptable

## Version Lifecycle
1. Active: Version is fully supported
2. Deprecated: Version is marked for removal
3. Sunset: Version is no longer available

## Breaking Changes
Breaking changes that require a new version include:
- Removing or renaming fields
- Changing field types
- Changing response structure
- Modifying endpoint behavior
- Removing endpoints

## Migration Guide
When migrating between versions:
1. Check the version header in your requests
2. Update client code to handle any breaking changes
3. Test thoroughly with the new version
4. Monitor for deprecation notices 