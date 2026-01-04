# React Native Migration Guide

This guide outlines the complete migration plan from the current web app to a native iOS/Android application using React Native with Expo.

## Phase 1: Project Setup (Week 1)

### 1.1 Initialize Expo App
```bash
# From project root
cd apps
npx create-expo-app mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-constants expo-status-bar
```

### 1.2 Configure Monorepo Structure
```json
// apps/mobile/package.json
{
  "name": "@memory-connector/mobile",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "nativewind": "^2.0.11"
  }
}
```

### 1.3 Share Code via Workspace
Create `packages/shared` for shared logic:
- API client functions
- TypeScript types
- Business logic utilities

```typescript
// packages/shared/src/types.ts
export interface Memory {
  id: string;
  title?: string;
  body?: string;
  createdAt: string;
  // ... other fields
}

// packages/shared/src/api/client.ts
export async function createMemory(data: CreateMemoryDto) {
  // Shared API logic
}
```

## Phase 2: Core Features (Week 2-3)

### 2.1 Authentication
```typescript
// apps/mobile/src/contexts/AuthContext.tsx
import * as SecureStore from 'expo-secure-store';

export function AuthProvider({ children }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load token from secure storage
    SecureStore.getItemAsync('accessToken').then(setToken);
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken } = await authAPI.login(email, password);
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    setToken(accessToken);
  };

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}
```

### 2.2 Navigation Structure
```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, Plus, Search, Bell } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          tabBarIcon: ({ color }) => <Plus color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Search color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <Bell color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### 2.3 Offline-First with WatermelonDB
```typescript
// apps/mobile/src/database/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'memories',
      columns: [
        { name: 'title', type: 'string', isOptional: true },
        { name: 'body', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

// apps/mobile/src/database/sync.ts
export async function syncMemories() {
  const unsyncedMemories = await database
    .get('memories')
    .query(Q.where('synced', false))
    .fetch();

  for (const memory of unsyncedMemories) {
    try {
      await api.createMemory({
        title: memory.title,
        body: memory.body,
        idempotencyKey: memory.id, // Use local ID as idempotency key
      });

      await memory.update((m) => {
        m.synced = true;
      });
    } catch (error) {
      console.error('Sync failed for memory:', memory.id, error);
    }
  }
}
```

## Phase 3: Native Features (Week 4)

### 3.1 Voice Input
```typescript
// apps/mobile/src/hooks/useVoiceInput.ts
import Voice from '@react-native-voice/voice';

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      setTranscript(e.value[0]);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    setIsListening(true);
    await Voice.start('en-US');
  };

  const stopListening = async () => {
    await Voice.stop();
    setIsListening(false);
  };

  return { isListening, transcript, startListening, stopListening };
}
```

### 3.2 Haptic Feedback
```typescript
// apps/mobile/src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error') {
  switch (type) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}
```

### 3.3 Share Extension
```typescript
// apps/mobile/src/screens/CaptureScreen.tsx
import * as Sharing from 'expo-sharing';

export function CaptureScreen() {
  useEffect(() => {
    // Handle shared content from other apps
    Sharing.getShareExtensionContent().then((content) => {
      if (content) {
        setTextValue(content.text || '');
        setImageUri(content.imageUri);
      }
    });
  }, []);
}
```

### 3.4 Location-Based Geofencing
```typescript
// apps/mobile/src/services/geofencing.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const GEOFENCE_TASK = 'background-geofencing';

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }

  if (data.eventType === Location.GeofencingEventType.Enter) {
    const { region } = data;
    // Fetch memory associated with this location
    const memory = await getMemoryByLocation(region.identifier);

    // Show notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Memory Reminder',
        body: memory.body || 'You have a memory at this location',
      },
      trigger: null, // Immediate
    });
  }
});

export async function startGeofencing(locationId: string, latitude: number, longitude: number, radius: number = 200) {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  await Location.startGeofencingAsync(GEOFENCE_TASK, [
    {
      identifier: locationId,
      latitude,
      longitude,
      radius,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
  ]);
}
```

## Phase 4: Performance Optimization (Week 5)

### 4.1 Image Caching
```typescript
// Use expo-image for automatic disk caching
import { Image } from 'expo-image';

<Image
  source={{ uri: memory.imageUrl }}
  cachePolicy="disk"
  contentFit="cover"
  transition={200}
/>
```

### 4.2 List Virtualization
```typescript
// Use FlashList for high-performance lists
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={memories}
  renderItem={({ item }) => <MemoryCard memory={item} />}
  estimatedItemSize={120}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

### 4.3 Bundle Optimization
```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
};
```

## Phase 5: App Store Deployment (Week 6)

### 5.1 Build Configuration
```json
// app.json
{
  "expo": {
    "name": "Memory Connector",
    "slug": "memory-connector",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.memoryconnector.app",
      "supportsTablet": true,
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Record voice notes",
        "NSLocationAlwaysUsageDescription": "Create location-based reminders",
        "NSCameraUsageDescription": "Capture memory photos"
      }
    },
    "android": {
      "package": "com.memoryconnector.app",
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

### 5.2 EAS Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Setup | 1 week | Working Expo project with shared code |
| Phase 2: Core Features | 2 weeks | Auth, navigation, offline sync |
| Phase 3: Native Features | 1 week | Voice, haptics, sharing, geofencing |
| Phase 4: Optimization | 1 week | Performance tuning, caching |
| Phase 5: Deployment | 1 week | App Store & Play Store release |
| **Total** | **6 weeks** | **Production mobile app** |

## Next Steps

1. Create `packages/shared` directory
2. Extract shared types and API logic from `apps/web`
3. Initialize `apps/mobile` with Expo
4. Implement authentication flow
5. Build core screens (Feed, Capture, Review)
6. Add native features incrementally
7. Test on physical devices
8. Deploy to app stores

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [WatermelonDB](https://nozbe.github.io/WatermelonDB/)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
