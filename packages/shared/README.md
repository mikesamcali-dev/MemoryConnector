# @memory-connector/shared

Shared TypeScript code between web and mobile applications.

## Contents

- **Types**: Shared TypeScript interfaces and types
- **API Client**: Reusable API client logic
- **Utilities**: Common validation and formatting functions

## Usage

### In Web App

```typescript
import { Memory, ApiClient, formatDate } from '@memory-connector/shared';
```

### In Mobile App (React Native)

```typescript
import { Memory, ApiClient, generateIdempotencyKey } from '@memory-connector/shared';
```

## Development

```bash
# Type check
pnpm typecheck
```
