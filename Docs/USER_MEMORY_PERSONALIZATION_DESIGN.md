# User Memory & Personalization System - Technical Design

## Executive Summary

This document outlines the architecture for an evidence-based user memory and personalization system for Memory Connector, focused on **automatic adaptive content delivery** to maximize **memory retention effectiveness**.

**Core Principles:**
- Evidence-based methods from cognitive science research
- Fully automatic adaptation based on performance data
- Low-friction user experience with progressive profile building
- Seamless integration with existing SRS, Memory Decks, Trainings, and Projects

**Reference:** `Docs/Memory improvement logic.md`

---

## 1. Database Schema Design

### 1.1 Core User Profile Table

```prisma
model UserMemoryProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Onboarding Data
  learningStyle           LearningStyle     // VISUAL, HANDS_ON, THEORETICAL, MIXED
  skillLevel              SkillLevel        // BEGINNER, INTERMEDIATE, ADVANCED
  primaryGoal             PrimaryGoal       // RETENTION, LEARNING, ORGANIZATION, HABIT_BUILDING
  preferredPace           PreferredPace     // INTENSIVE, MODERATE, GRADUAL
  dailyTimeCommitment     Int               // Minutes per day (5, 10, 15, 30, 60)
  areasOfInterest         String[]          // Array of interest tags
  cognitivePreferences    Json              // Extended preferences (errorless learning, dual coding, etc.)

  // Adaptive Performance Tracking
  averageRecallRate       Float    @default(0.0)    // Overall success rate (0.0-1.0)
  averageReviewTime       Int      @default(0)      // Avg seconds per review
  optimalReviewInterval   Float    @default(1.0)    // Personalized base interval multiplier
  preferredReviewTime     String?                   // Time of day pattern (e.g., "morning", "evening")
  lastAdaptationUpdate    DateTime @default(now())  // When profile was last recalculated

  // Engagement Patterns
  peakActivityHours       Int[]                     // Hours of day (0-23) with highest engagement
  consecutiveMissedDays   Int      @default(0)      // Streak of missed review days
  totalCheckIns           Int      @default(0)      // Profile refinement check-ins completed

  // State
  onboardingCompleted     Boolean  @default(false)
  lastCheckInDate         DateTime?                 // Last profile refinement date

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

enum LearningStyle {
  VISUAL          // Images, dual coding, visual mnemonics
  HANDS_ON        // Interactive practice, errorless learning
  THEORETICAL     // Elaborative encoding, conceptual understanding
  MIXED           // Balanced approach
}

enum SkillLevel {
  BEGINNER        // More support, errorless learning, recognition-based
  INTERMEDIATE    // Balanced challenge, mixed recall types
  ADVANCED        // Free recall, complex elaboration, higher intervals
}

enum PrimaryGoal {
  RETENTION       // Optimize for long-term memory retention
  LEARNING        // Focus on acquiring new information quickly
  ORGANIZATION    // Emphasis on structure, projects, and connections
  HABIT_BUILDING  // Consistency, streaks, daily routines
}

enum PreferredPace {
  INTENSIVE       // High daily volume, shorter intervals
  MODERATE        // Balanced workload, standard intervals
  GRADUAL         // Lower volume, extended intervals
}
```

### 1.2 Implementation Intentions (If-Then Plans)

```prisma
model ImplementationIntention {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // If-Then Structure
  triggerType     TriggerType                   // TIME, LOCATION, ROUTINE, CONTEXT
  triggerValue    String                        // e.g., "08:00", "lat,lng", "after_breakfast"
  action          String                        // e.g., "Review today's memories"
  ifThenPhrase    String                        // e.g., "If it's 8 AM, review today's memories"

  // Configuration
  enabled         Boolean  @default(true)
  frequency       Frequency @default(DAILY)     // DAILY, WEEKDAYS, CUSTOM
  customDays      Int[]                         // Days of week (0-6) for CUSTOM frequency

  // Tracking & Adaptation
  completionCount Int      @default(0)          // Times successfully completed
  missedCount     Int      @default(0)          // Times missed
  lastTriggeredAt DateTime?
  lastCompletedAt DateTime?

  // Escalation (from memory improvement doc)
  firstReminderMinutes  Int @default(0)         // Immediate
  secondReminderMinutes Int @default(120)       // 2 hours after first miss
  thirdReminderMinutes  Int @default(1440)      // 24 hours after second miss (suggests simplification)

  // State
  isPaused        Boolean  @default(false)      // Auto-paused after 3 consecutive misses
  pausedAt        DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, enabled])
  @@index([userId, triggerType])
}

enum TriggerType {
  TIME        // Specific time of day
  LOCATION    // Geofence trigger (requires location permission)
  ROUTINE     // After/before a routine event (meal, work, sleep)
  CONTEXT     // Activity-based (e.g., commute, exercise)
}

enum Frequency {
  DAILY       // Every day
  WEEKDAYS    // Monday-Friday
  WEEKENDS    // Saturday-Sunday
  CUSTOM      // Specific days defined in customDays
}
```

### 1.3 Adaptive Review Configuration

```prisma
model AdaptiveReviewConfig {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Spaced Repetition Parameters (from memory improvement doc)
  initialInterval     Float   @default(1.0)      // Days (default: 1 day)
  easeFactorDefault   Float   @default(2.3)      // SM-2 default
  maxInterval         Int     @default(30)       // Days (default: 30 days)
  minEaseFactor       Float   @default(1.3)      // Minimum ease factor

  // Personalized Multipliers (auto-adjusted)
  intervalMultiplier  Float   @default(1.0)      // 0.5-2.0 range, adjusts based on performance
  difficultyThreshold Float   @default(0.8)      // If recall rate < threshold, reduce intervals

  // Review Session Preferences
  maxReviewsPerSession Int    @default(20)       // Based on skill level and pace
  preferRecognition    Boolean @default(false)   // Recognition vs free recall (skill-based)
  showContext          Boolean @default(true)    // Show location, person, date context
  enableHapticFeedback Boolean @default(true)    // Haptic on review submission

  // Adaptive Scheduling Rules
  adaptiveScheduling   Boolean @default(true)    // Enable automatic adjustment
  forgivenessFactor    Float   @default(0.5)     // How much to reduce interval on failure (default: halve)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

### 1.4 Daily Check-In Tracking

```prisma
model DailyCheckIn {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  checkInDate         DateTime @default(now())   // Date of check-in (normalized to day)

  // Completion Data
  reviewsDue          Int      @default(0)       // Reviews due at start of day
  reviewsCompleted    Int      @default(0)       // Reviews completed during day
  intentionsTriggered Int      @default(0)       // If-then plans triggered
  intentionsCompleted Int      @default(0)       // If-then plans completed

  // Self-Report (optional quick survey)
  confidenceLevel     Int?                       // 1-5 scale (how confident in retention)
  difficultyLevel     Int?                       // 1-5 scale (how challenging were reviews)
  timeSpentMinutes    Int?                       // Self-reported time

  // Adaptive Insights
  suggestedAdjustment String?                    // System suggestion (e.g., "reduce_volume", "increase_interval")
  userAcknowledged    Boolean  @default(false)   // Whether user saw/acted on suggestion

  createdAt DateTime @default(now())

  @@unique([userId, checkInDate])
  @@index([userId])
  @@index([checkInDate])
}
```

### 1.5 Profile Refinement Check-Ins

```prisma
model ProfileCheckIn {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  checkInType         CheckInType              // WEEKLY, MONTHLY, TRIGGERED
  triggerReason       String?                  // e.g., "low_engagement", "high_failure_rate"

  // Questions Asked (dynamic based on context)
  questions           Json                     // Array of question objects with answers

  // Resulting Profile Changes
  profileUpdatesBefore Json                    // Snapshot of profile before
  profileUpdatesAfter  Json                    // Snapshot of profile after

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([checkInType])
}

enum CheckInType {
  WEEKLY      // Periodic check-in after 7 days
  MONTHLY     // Periodic check-in after 30 days
  TRIGGERED   // Triggered by performance metrics (e.g., 3 consecutive low-recall days)
}
```

---

## 2. Onboarding Questionnaire Design

### 2.1 Question Flow (8-12 Questions)

**Welcome Screen:**
> "Let's personalize your memory experience! Answer a few quick questions so we can optimize your learning journey."

#### Q1: Learning Style (Required)
**Question:** "How do you learn best?"
**Type:** Single choice with icons
**Options:**
- 🖼️ **Visual** - "I remember better with images and diagrams"
- 🛠️ **Hands-On** - "I learn by doing and practicing"
- 📚 **Theoretical** - "I prefer understanding concepts deeply"
- 🌈 **Mixed** - "I like a combination of approaches"

**Maps to:** `UserMemoryProfile.learningStyle`

---

#### Q2: Current Experience Level (Required)
**Question:** "What's your experience with memory techniques?"
**Type:** Single choice
**Options:**
- 🌱 **Beginner** - "I'm new to memory training"
- 🌿 **Intermediate** - "I've tried some techniques before"
- 🌲 **Advanced** - "I regularly practice memory techniques"

**Maps to:** `UserMemoryProfile.skillLevel`

---

#### Q3: Primary Goal (Required)
**Question:** "What's your main goal with Memory Connector?"
**Type:** Single choice
**Options:**
- 🧠 **Retention** - "Remember important information longer"
- 📖 **Learning** - "Acquire new knowledge quickly"
- 📁 **Organization** - "Keep my thoughts and ideas organized"
- 🎯 **Habit Building** - "Build consistent daily memory habits"

**Maps to:** `UserMemoryProfile.primaryGoal`

---

#### Q4: Time Commitment (Required)
**Question:** "How much time can you dedicate daily?"
**Type:** Single choice with time estimates
**Options:**
- ⚡ **5 minutes** - "Quick daily reviews"
- ⏱️ **10 minutes** - "Balanced approach" *(Recommended)*
- 🕐 **15 minutes** - "Focused practice"
- 🕑 **30 minutes** - "Deep engagement"
- 🕒 **60+ minutes** - "Intensive training"

**Maps to:** `UserMemoryProfile.dailyTimeCommitment`

---

#### Q5: Preferred Pace (Required)
**Question:** "What learning pace suits you best?"
**Type:** Single choice
**Options:**
- 🚀 **Intensive** - "I want to review frequently and learn fast"
- ⚖️ **Moderate** - "Balanced pace with steady progress" *(Recommended)*
- 🐢 **Gradual** - "I prefer a slower, relaxed approach"

**Maps to:** `UserMemoryProfile.preferredPace`

---

#### Q6: Best Time to Review (Optional)
**Question:** "When do you prefer to review your memories?"
**Type:** Single choice
**Options:**
- ☀️ **Morning** - "Start my day with reviews"
- 🌆 **Afternoon** - "Midday break works best"
- 🌙 **Evening** - "Wind down with reviews before bed"
- 🎲 **Flexible** - "Any time works for me"

**Maps to:** `UserMemoryProfile.preferredReviewTime`

---

#### Q7: Areas of Interest (Optional)
**Question:** "What topics are you most interested in? (Select all that apply)"
**Type:** Multi-select chips
**Options:**
- 🗣️ People & Relationships
- 📍 Places & Travel
- 📚 Learning & Education
- 💼 Work & Professional
- 🏥 Health & Wellness
- 🎨 Creative Projects
- 📝 Personal Notes
- 🌍 Languages & Vocabulary
- 🎯 Goals & Habits
- 📖 Other

**Maps to:** `UserMemoryProfile.areasOfInterest` (array)

---

#### Q8: Reminder Preferences (Optional)
**Question:** "Would you like context-aware reminders?"
**Type:** Toggle with explanation
**Options:**
- ✅ **Yes** - "Remind me to review based on my routine" *(Recommended)*
  - *Sub-question:* "When should I remind you?"
    - Options: "Morning", "After work", "Before bed", "Custom"
- ❌ **No** - "I'll review on my own schedule"

**Maps to:** Creates default `ImplementationIntention` if enabled

---

#### Q9: Cognitive Preferences (Advanced, Optional)
**Question:** "How do you prefer to practice recall?"
**Type:** Single choice with tooltips
**Options:**
- 💭 **Free Recall** - "I want to recall from memory without hints"
- 🎯 **Recognition** - "Show me options to choose from" *(Easier)*
- 🤝 **Adaptive** - "Let the system decide based on my performance" *(Recommended)*

**Maps to:** `AdaptiveReviewConfig.preferRecognition`

---

#### Q10: Difficulty Tolerance (Optional)
**Question:** "How do you feel about challenging reviews?"
**Type:** Slider (1-5)
**Options:**
- 1 = "Keep it easy, avoid frustration"
- 3 = "Balanced challenge" *(Default)*
- 5 = "Push me hard, I want a challenge"

**Maps to:** `AdaptiveReviewConfig.difficultyThreshold` (inverse scaling: 1→0.9, 3→0.8, 5→0.7)

---

#### Q11: Context Display (Optional)
**Question:** "Show extra context during reviews?"
**Type:** Toggle
**Options:**
- ✅ **Yes** - "Show when and where I captured memories" *(Recommended)*
- ❌ **No** - "Just show the core content"

**Maps to:** `AdaptiveReviewConfig.showContext`

---

#### Q12: Haptic Feedback (Mobile Only, Optional)
**Question:** "Enable haptic feedback during reviews?"
**Type:** Toggle
**Options:**
- ✅ **Yes** - "Vibrate on button presses" *(Recommended)*
- ❌ **No** - "No vibration"

**Maps to:** `AdaptiveReviewConfig.enableHapticFeedback`

---

### 2.2 Progressive Disclosure Strategy

**Mandatory Questions (4):** Q1-Q4 (Learning style, skill level, goal, time)
**Recommended Questions (4):** Q5-Q8 (Pace, time preference, interests, reminders)
**Advanced Questions (4):** Q9-Q12 (Recall type, difficulty, context, haptics)

**UX Flow:**
1. Show mandatory questions first (page 1)
2. Page 2: "Want to personalize further?" → Show recommended questions
3. Page 3: "Advanced options" → Show advanced questions with "Skip" button

**Total Time:** ~2-3 minutes for full questionnaire, ~1 minute for mandatory only

---

## 3. Adaptive Content Service Architecture

### 3.1 Service Structure

```typescript
// apps/api/src/modules/user-memory/user-memory.service.ts

@Injectable()
export class UserMemoryService {

  /**
   * Initialize user memory profile from onboarding responses
   */
  async createProfileFromOnboarding(
    userId: string,
    answers: OnboardingAnswersDto
  ): Promise<UserMemoryProfile> {
    // 1. Create UserMemoryProfile with onboarding data
    // 2. Create AdaptiveReviewConfig with personalized defaults
    // 3. Optionally create ImplementationIntention if reminders enabled
    // 4. Return complete profile
  }

  /**
   * Calculate personalized review parameters based on profile
   */
  async getPersonalizedReviewConfig(userId: string): Promise<ReviewConfigDto> {
    // Retrieve profile and config
    // Apply skill level adjustments:
    //   - BEGINNER: maxReviewsPerSession=10, preferRecognition=true, showContext=true
    //   - INTERMEDIATE: maxReviewsPerSession=20, preferRecognition=false, showContext=true
    //   - ADVANCED: maxReviewsPerSession=30, preferRecognition=false, showContext=false

    // Apply pace adjustments:
    //   - INTENSIVE: intervalMultiplier=0.8, maxInterval=21 days
    //   - MODERATE: intervalMultiplier=1.0, maxInterval=30 days
    //   - GRADUAL: intervalMultiplier=1.5, maxInterval=60 days

    // Apply learning style enhancements:
    //   - VISUAL: Prioritize dual-coded memories (with images)
    //   - HANDS_ON: Prioritize errorless learning (recognition mode)
    //   - THEORETICAL: Add elaboration prompts
  }

  /**
   * Adapt review intervals based on recent performance (run daily)
   */
  async adaptReviewParameters(userId: string): Promise<void> {
    // 1. Calculate averageRecallRate from last 30 days
    // 2. Calculate averageReviewTime
    // 3. Detect peakActivityHours from DailyCheckIn data

    // 4. Adjust intervalMultiplier:
    //    - If recallRate > 0.9: increase multiplier by 0.1 (up to 2.0)
    //    - If recallRate < difficultyThreshold: decrease multiplier by 0.1 (down to 0.5)

    // 5. Update UserMemoryProfile.optimalReviewInterval
    // 6. Update lastAdaptationUpdate timestamp
  }

  /**
   * Get personalized due reviews with adaptive ordering
   */
  async getAdaptiveDueReviews(userId: string, limit?: number): Promise<Memory[]> {
    // 1. Get base due reviews from ReviewsService
    // 2. Apply learning style preferences:
    //    - VISUAL: Prioritize memories with images
    //    - HANDS_ON: Prioritize memories with lower reviewCount (more practice needed)
    //    - THEORETICAL: Prioritize memories with complex content (longer textContent)

    // 3. Apply time-of-day optimization:
    //    - If current hour matches preferredReviewTime, boost priority

    // 4. Apply goal-based sorting:
    //    - RETENTION: Sort by nextReviewAt ASC (strict SRS)
    //    - LEARNING: Prioritize newer memories (createdAt DESC)
    //    - ORGANIZATION: Prioritize memories with projects/topics
    //    - HABIT_BUILDING: Randomize to maintain variety

    // 5. Respect maxReviewsPerSession from AdaptiveReviewConfig
    // 6. Return ordered and limited set
  }

  /**
   * Track daily check-in and provide adaptive suggestions
   */
  async recordDailyCheckIn(
    userId: string,
    data: DailyCheckInDto
  ): Promise<DailyCheckInWithSuggestions> {
    // 1. Create DailyCheckIn record
    // 2. Analyze trends (consecutive misses, recall rate drop)
    // 3. Generate suggestions:
    //    - "reduce_volume" if reviewsCompleted < 50% of reviewsDue
    //    - "increase_interval" if averageRecallRate > 0.95 (too easy)
    //    - "simplify_content" if averageRecallRate < 0.6 (too hard)
    //    - "shift_time" if engagement outside peakActivityHours

    // 4. Return check-in with suggestions
  }

  /**
   * Determine if profile refinement check-in is needed
   */
  async shouldTriggerCheckIn(userId: string): Promise<CheckInTrigger | null> {
    // Trigger conditions:
    // 1. Weekly: 7 days since last check-in
    // 2. Monthly: 30 days since last check-in
    // 3. Low engagement: consecutiveMissedDays >= 3
    // 4. High failure rate: averageRecallRate < 0.5 for 7+ days
    // 5. Dramatic improvement: averageRecallRate > 0.95 for 14+ days (suggest increasing difficulty)

    // Return CheckInType and triggerReason if applicable
  }

  /**
   * Process profile refinement check-in responses
   */
  async processProfileCheckIn(
    userId: string,
    checkInType: CheckInType,
    responses: CheckInResponsesDto
  ): Promise<UserMemoryProfile> {
    // 1. Store ProfileCheckIn record with before/after snapshots
    // 2. Update UserMemoryProfile fields based on responses
    // 3. Adjust AdaptiveReviewConfig if needed
    // 4. Reset adaptation metrics (lastAdaptationUpdate)
    // 5. Return updated profile
  }
}
```

### 3.2 Integration with Existing ReviewsService

**Modify:** `apps/api/src/reviews/reviews.service.ts`

```typescript
// Inject UserMemoryService
constructor(
  private prisma: PrismaService,
  private userMemoryService: UserMemoryService,
  private gamificationService: GamificationService,
) {}

// Replace getDueReviews with adaptive version
async getDueReviews(userId: string, limit = 20): Promise<Memory[]> {
  // Check if user has completed onboarding
  const profile = await this.userMemoryService.getProfile(userId);

  if (profile?.onboardingCompleted) {
    // Use adaptive retrieval
    return this.userMemoryService.getAdaptiveDueReviews(userId, limit);
  } else {
    // Fallback to standard SRS (existing logic)
    return this.getStandardDueReviews(userId, limit);
  }
}

// Update submitReview to use personalized config
async submitReview(
  userId: string,
  memoryId: string,
  rating: ReviewRating
): Promise<Memory> {
  // Get personalized config
  const config = await this.userMemoryService.getPersonalizedReviewConfig(userId);

  // Calculate next review using personalized parameters
  const { easeFactor, interval } = this.calculateSM2WithConfig(
    memory,
    rating,
    config
  );

  // Update memory (existing logic with personalized values)
  // ...

  // Track for daily check-in
  await this.userMemoryService.recordReviewCompletion(userId, memoryId, rating);

  return updatedMemory;
}

// New helper method
private calculateSM2WithConfig(
  memory: Memory,
  rating: ReviewRating,
  config: ReviewConfigDto
): { easeFactor: number; interval: number } {
  // Apply personalized ease factor and interval calculations
  // Use config.easeFactorDefault, config.intervalMultiplier, config.maxInterval
  // Apply config.forgivenessFactor on failures
}
```

---

## 4. Implementation Intentions (If-Then Planning) System

### 4.1 Service Implementation

```typescript
// apps/api/src/modules/implementation-intentions/implementation-intentions.service.ts

@Injectable()
export class ImplementationIntentionsService {

  /**
   * Create a new if-then plan
   */
  async create(
    userId: string,
    dto: CreateIntentionDto
  ): Promise<ImplementationIntention> {
    // 1. Validate trigger type and value
    //    - TIME: validate time format (HH:MM)
    //    - LOCATION: validate lat,lng format
    //    - ROUTINE: validate routine enum (breakfast, work_start, etc.)

    // 2. Generate if-then phrase if not provided
    //    Example: "If it's 8:00 AM, review today's memories"

    // 3. Create ImplementationIntention record
    // 4. Schedule first trigger (if TIME-based, use cron)

    return intention;
  }

  /**
   * Check and trigger due intentions (run every minute via cron)
   */
  @Cron('* * * * *') // Every minute
  async checkAndTriggerIntentions(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find all TIME-based intentions matching current time
    const dueIntentions = await this.prisma.implementationIntention.findMany({
      where: {
        enabled: true,
        isPaused: false,
        triggerType: TriggerType.TIME,
        triggerValue: currentTime,
      },
      include: { user: true },
    });

    for (const intention of dueIntentions) {
      // Check frequency (DAILY, WEEKDAYS, CUSTOM)
      if (!this.shouldTriggerToday(intention, now)) continue;

      // Create reminder notification
      await this.createReminderNotification(intention);

      // Update lastTriggeredAt
      await this.prisma.implementationIntention.update({
        where: { id: intention.id },
        data: { lastTriggeredAt: now },
      });
    }
  }

  /**
   * Mark intention as completed
   */
  async markCompleted(userId: string, intentionId: string): Promise<void> {
    const intention = await this.prisma.implementationIntention.findFirst({
      where: { id: intentionId, userId },
    });

    if (!intention) throw new NotFoundException();

    // Update completion tracking
    await this.prisma.implementationIntention.update({
      where: { id: intentionId },
      data: {
        completionCount: { increment: 1 },
        lastCompletedAt: new Date(),
        consecutiveMissedDays: 0, // Reset miss counter
      },
    });

    // Record in DailyCheckIn
    await this.userMemoryService.recordIntentionCompletion(userId, intentionId);
  }

  /**
   * Handle missed intention (escalation logic from memory improvement doc)
   */
  async handleMiss(intentionId: string): Promise<void> {
    const intention = await this.prisma.implementationIntention.findUnique({
      where: { id: intentionId },
    });

    if (!intention) return;

    const missCount = intention.missedCount + 1;

    // Escalation strategy from Docs/Memory improvement logic.md:
    // - First miss: gentle check-in after 2 hours (120 min)
    // - Second miss: follow-up after 24 hours (1440 min)
    // - Third miss: pause and suggest simplification

    if (missCount === 1) {
      // Schedule follow-up in 2 hours
      await this.scheduleFollowUpReminder(intention, 120);
    } else if (missCount === 2) {
      // Schedule follow-up in 24 hours + suggest reschedule
      await this.scheduleFollowUpReminder(intention, 1440);
      await this.createReschedulePrompt(intention);
    } else if (missCount >= 3) {
      // Pause and prompt user to review
      await this.prisma.implementationIntention.update({
        where: { id: intentionId },
        data: {
          isPaused: true,
          pausedAt: new Date(),
        },
      });
      await this.createSimplificationPrompt(intention);
    }

    // Increment miss counter
    await this.prisma.implementationIntention.update({
      where: { id: intentionId },
      data: { missedCount: { increment: 1 } },
    });
  }

  /**
   * Get user's active intentions
   */
  async getActiveIntentions(userId: string): Promise<ImplementationIntention[]> {
    return this.prisma.implementationIntention.findMany({
      where: {
        userId,
        enabled: true,
        isPaused: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Helper: Should intention trigger today?
   */
  private shouldTriggerToday(intention: ImplementationIntention, date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

    switch (intention.frequency) {
      case Frequency.DAILY:
        return true;
      case Frequency.WEEKDAYS:
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case Frequency.WEEKENDS:
        return dayOfWeek === 0 || dayOfWeek === 6;
      case Frequency.CUSTOM:
        return intention.customDays.includes(dayOfWeek);
      default:
        return false;
    }
  }

  /**
   * Create reminder notification (integrate with existing reminders system)
   */
  private async createReminderNotification(intention: ImplementationIntention): Promise<void> {
    // Create reminder using existing RemindersService
    // Map intention.action to reminder content
    // Example: "Time to review today's memories!" (based on ifThenPhrase)
  }

  /**
   * Schedule follow-up reminder after miss
   */
  private async scheduleFollowUpReminder(
    intention: ImplementationIntention,
    delayMinutes: number
  ): Promise<void> {
    // Schedule delayed notification
    // Content: "Still relevant? Reschedule or skip."
  }

  /**
   * Prompt user to simplify or adjust intention
   */
  private async createSimplificationPrompt(intention: ImplementationIntention): Promise<void> {
    // Create system notification suggesting:
    // - Change trigger time
    // - Reduce frequency
    // - Simplify action
    // - Disable intention
  }
}
```

### 4.2 Frontend Components

**Daily Dashboard (`apps/web/src/pages/DailyDashboardPage.tsx`):**
- Show today's due reviews (from adaptive system)
- Show active implementation intentions with completion checkboxes
- Show daily check-in summary (reviews completed, intentions completed)
- Quick snooze/reschedule options for intentions

**Intention Setup Flow (`apps/web/src/pages/IntentionSetupPage.tsx`):**
- Step 1: Select trigger type (Time, Location, Routine)
- Step 2: Configure trigger (time picker, location selector, routine dropdown)
- Step 3: Define action (preset options + custom)
- Step 4: Set frequency (Daily, Weekdays, Custom days)
- Step 5: Preview if-then phrase, confirm

---

## 5. Implementation Plan & Integration Strategy

### Phase 1: Foundation (Week 1-2)

**Backend:**
1. Create database schema (Prisma models above)
2. Run migration: `cd apps/api && npx prisma migrate dev --name add_user_memory_system`
3. Generate Prisma client: `npx prisma generate`
4. Create `user-memory` module with service and controller
5. Create `implementation-intentions` module with service and controller
6. Create DTOs for all endpoints

**Frontend:**
1. Create onboarding flow (`apps/web/src/pages/OnboardingPage.tsx`)
2. Create API client methods for user memory endpoints
3. Add onboarding route (redirect on first login if not completed)

**Testing:**
- Unit tests for UserMemoryService methods
- E2E test for onboarding flow

---

### Phase 2: Adaptive Content (Week 3-4)

**Backend:**
1. Implement adaptive review retrieval in UserMemoryService
2. Modify ReviewsService to use adaptive config
3. Implement daily adaptation cron job
4. Add profile refinement check-in logic

**Frontend:**
1. Update SynapseReviewPage to use adaptive reviews
2. Add daily dashboard page
3. Add profile settings page (edit preferences)
4. Add check-in modal (triggered by backend)

**Testing:**
- Integration tests for adaptive algorithms
- Performance tests for review queries with personalization

---

### Phase 3: Implementation Intentions (Week 5-6)

**Backend:**
1. Implement ImplementationIntentionsService with cron triggers
2. Integrate with existing RemindersService
3. Add escalation and miss-handling logic
4. Create admin endpoints for debugging intentions

**Frontend:**
1. Create intention setup flow
2. Add intention management page (list, edit, delete)
3. Integrate with daily dashboard (show active intentions)
4. Add notification handling for intention triggers

**Testing:**
- Cron job testing (verify time-based triggers)
- Miss-handling flow testing
- Notification delivery testing

---

### Phase 4: Refinement & Analytics (Week 7-8)

**Backend:**
1. Implement weekly/monthly check-in triggers
2. Add analytics endpoints (profile effectiveness, adaptation history)
3. Performance optimization (caching, query optimization)
4. Add admin dashboard endpoints

**Frontend:**
1. Create profile analytics page (show adaptation history, trends)
2. Add check-in history view
3. Polish UI/UX based on testing feedback
4. Add help content for new features

**Testing:**
- Load testing for adaptive queries
- User acceptance testing
- A/B testing preparation (if desired)

---

## 6. API Endpoints Summary

### User Memory Profile

```
POST   /api/v1/user-memory/onboarding          # Complete onboarding
GET    /api/v1/user-memory/profile             # Get current profile
PUT    /api/v1/user-memory/profile             # Update profile
GET    /api/v1/user-memory/review-config       # Get personalized review config
PUT    /api/v1/user-memory/review-config       # Update review config
GET    /api/v1/user-memory/check-in-status     # Check if check-in needed
POST   /api/v1/user-memory/check-in            # Submit check-in responses
GET    /api/v1/user-memory/analytics           # Get profile analytics
```

### Implementation Intentions

```
POST   /api/v1/intentions                      # Create new intention
GET    /api/v1/intentions                      # Get user's intentions
GET    /api/v1/intentions/:id                  # Get specific intention
PUT    /api/v1/intentions/:id                  # Update intention
DELETE /api/v1/intentions/:id                  # Delete intention
POST   /api/v1/intentions/:id/complete         # Mark as completed
POST   /api/v1/intentions/:id/snooze           # Snooze intention
POST   /api/v1/intentions/:id/resume           # Resume paused intention
```

### Daily Check-In

```
POST   /api/v1/daily-check-in                  # Record daily check-in
GET    /api/v1/daily-check-in/today            # Get today's check-in
GET    /api/v1/daily-check-in/history          # Get check-in history (last 30 days)
```

### Adaptive Reviews (Modified Existing)

```
GET    /api/v1/reviews/due                     # Now uses adaptive retrieval if onboarded
POST   /api/v1/reviews/submit                  # Now uses personalized config
```

---

## 7. Key Algorithms & Logic

### 7.1 Adaptive Interval Calculation

**Based on:** SM-2 algorithm + personalized multipliers

```typescript
function calculateAdaptiveInterval(
  memory: Memory,
  rating: ReviewRating,
  config: AdaptiveReviewConfig,
  profile: UserMemoryProfile
): { easeFactor: number; interval: number } {

  let easeFactor = memory.easeFactor || config.easeFactorDefault;
  let interval = memory.reviewInterval || config.initialInterval;

  // SM-2 ease factor adjustment
  if (rating === ReviewRating.AGAIN) {
    easeFactor = Math.max(config.minEaseFactor, easeFactor - 0.2);
    interval = Math.max(1, interval * config.forgivenessFactor); // Default: halve interval
  } else if (rating === ReviewRating.HARD) {
    easeFactor = Math.max(config.minEaseFactor, easeFactor - 0.15);
    interval = interval * 1.2; // Slight increase
  } else if (rating === ReviewRating.GOOD) {
    interval = interval * easeFactor;
  } else if (rating === ReviewRating.EASY) {
    easeFactor = easeFactor + 0.1;
    interval = interval * easeFactor * 1.3; // Bonus for easy
  }

  // Apply personalized multiplier
  interval = interval * config.intervalMultiplier * profile.optimalReviewInterval;

  // Apply pace-based adjustments
  switch (profile.preferredPace) {
    case PreferredPace.INTENSIVE:
      interval = interval * 0.8; // 20% shorter intervals
      break;
    case PreferredPace.GRADUAL:
      interval = interval * 1.5; // 50% longer intervals
      break;
    // MODERATE: no adjustment
  }

  // Cap at max interval
  interval = Math.min(interval, config.maxInterval);

  return { easeFactor, interval: Math.round(interval) };
}
```

### 7.2 Profile Adaptation Logic (Daily Cron)

```typescript
async function adaptProfileDaily(userId: string): Promise<void> {
  // Get recent performance data (last 30 days)
  const recentReviews = await getRecentReviews(userId, 30);

  const totalReviews = recentReviews.length;
  const successfulReviews = recentReviews.filter(
    r => r.rating !== ReviewRating.AGAIN
  ).length;

  const averageRecallRate = totalReviews > 0
    ? successfulReviews / totalReviews
    : 0;

  const config = await getReviewConfig(userId);
  const profile = await getProfile(userId);

  // Adjust interval multiplier
  let newMultiplier = config.intervalMultiplier;

  if (averageRecallRate > 0.9 && totalReviews >= 20) {
    // Too easy - increase intervals
    newMultiplier = Math.min(2.0, newMultiplier + 0.1);
  } else if (averageRecallRate < config.difficultyThreshold && totalReviews >= 10) {
    // Too hard - decrease intervals
    newMultiplier = Math.max(0.5, newMultiplier - 0.1);
  }

  // Update profile
  await updateProfile(userId, {
    averageRecallRate,
    optimalReviewInterval: newMultiplier,
    lastAdaptationUpdate: new Date(),
  });

  // Update config if changed
  if (newMultiplier !== config.intervalMultiplier) {
    await updateReviewConfig(userId, {
      intervalMultiplier: newMultiplier,
    });
  }
}
```

### 7.3 Adaptive Review Ordering

```typescript
function orderReviewsByProfile(
  reviews: Memory[],
  profile: UserMemoryProfile
): Memory[] {

  switch (profile.learningStyle) {
    case LearningStyle.VISUAL:
      // Prioritize memories with images
      return reviews.sort((a, b) => {
        const aHasImage = a.image != null ? 1 : 0;
        const bHasImage = b.image != null ? 1 : 0;
        return bHasImage - aHasImage; // Images first
      });

    case LearningStyle.HANDS_ON:
      // Prioritize memories with lower review count (more practice needed)
      return reviews.sort((a, b) => a.reviewCount - b.reviewCount);

    case LearningStyle.THEORETICAL:
      // Prioritize complex memories (longer content)
      return reviews.sort((a, b) => b.textContent.length - a.textContent.length);

    default:
      // Default: strict SRS order
      return reviews.sort((a, b) =>
        a.nextReviewAt.getTime() - b.nextReviewAt.getTime()
      );
  }
}
```

---

## 8. Frontend User Experience Flow

### 8.1 First-Time User Journey

1. **Sign Up** → Redirect to onboarding
2. **Onboarding Page 1** (Mandatory questions: learning style, skill level, goal, time commitment)
3. **Onboarding Page 2** (Recommended questions: pace, time preference, interests, reminders)
4. **Onboarding Page 3** (Advanced options - skippable)
5. **Setup Confirmation** → Show personalized dashboard preview
6. **Redirect to Daily Dashboard** → Start using app with adaptive content

### 8.2 Daily User Flow

**Morning (8:00 AM - Implementation Intention Triggers):**
- Push notification: "Good morning! Time to review today's memories 🧠"
- User opens app → Daily Dashboard shows:
  - Active intention: "✅ If it's 8 AM, review today's memories" (mark complete)
  - Due reviews: 12 reviews ready (adaptive ordering)
  - Quick stats: 3-day streak, 87% recall rate

**Review Session:**
- User taps "Start Review" → Adaptive review interface
- Content personalized:
  - Visual learner → Shows memories with images first
  - Beginner skill → Recognition-based prompts offered
  - Moderate pace → Max 20 reviews per session
- After each review: System updates ease factors with personalized multipliers

**Evening Check-In:**
- System prompts: "How was today's review session?" (optional 1-5 rating)
- User submits rating → Daily check-in recorded
- System analyzes: "Great progress! 11/12 reviews completed 🎉"

**Weekly Check-In (7 Days Later):**
- Modal: "Quick check-in: Is your review schedule working for you?"
- 2-3 questions about difficulty, time commitment, satisfaction
- System adapts profile based on responses

---

## 9. Privacy & Ethics Considerations

### 9.1 Data Minimization
- Only collect necessary profile data
- Allow users to skip optional questions
- Provide clear explanations for why each data point is collected

### 9.2 Transparency
- Show users how their data influences content (e.g., "We're showing visual content because you selected Visual learner")
- Allow manual override of all adaptive decisions
- Provide profile analytics dashboard (show adaptation history)

### 9.3 User Control
- Users can edit profile anytime
- Users can disable adaptive features and revert to standard SRS
- Users can delete implementation intentions
- Users can reset profile and re-do onboarding

### 9.4 Accessibility
- Onboarding questionnaire accessible via keyboard and screen readers
- All profile settings available via settings page (not just onboarding)
- Haptic feedback optional (mobile)
- Context display optional (cognitive load reduction)

---

## 10. Success Metrics & Validation

### 10.1 Key Metrics to Track

**Retention Effectiveness:**
- Average recall rate per user (target: >80%)
- Review completion rate (target: >70% of due reviews completed daily)
- Long-term retention (recall rate for memories >30 days old)

**Engagement:**
- Daily active usage rate (target: >50% of users open app daily)
- Review session consistency (days with reviews / total days since signup)
- Implementation intention completion rate (target: >60%)

**Personalization Impact:**
- Profile adaptation frequency (how often system adjusts parameters)
- User satisfaction with adaptive content (via check-in ratings)
- Time to complete onboarding (target: <3 minutes)

**Adaptive Algorithm Performance:**
- Correlation between profile parameters and recall rate
- Interval multiplier distribution (are most users near 1.0 or adjusted?)
- Check-in trigger accuracy (are triggers happening at right times?)

### 10.2 A/B Testing Opportunities

1. **Onboarding length:** Mandatory only vs. Full questionnaire
2. **Adaptive ordering:** Learning style-based vs. strict SRS
3. **Interval adjustments:** Aggressive adaptation (±0.1 per day) vs. conservative (±0.05)
4. **Implementation intentions:** Default enabled vs. opt-in
5. **Check-in frequency:** Weekly vs. bi-weekly vs. triggered-only

---

## 11. Technical Considerations

### 11.1 Performance Optimization

**Database Indexes:**
```prisma
@@index([userId, onboardingCompleted])
@@index([userId, triggerType, enabled])
@@index([userId, checkInDate])
```

**Caching Strategy:**
- Cache UserMemoryProfile and AdaptiveReviewConfig in Redis (TTL: 1 hour)
- Invalidate cache on profile updates
- Cache daily check-in status (TTL: 1 day)

**Query Optimization:**
- Batch load profiles when processing multiple users (cron jobs)
- Use database views for complex analytics queries
- Paginate check-in history (limit to 30 days by default)

### 11.2 Scalability

**Cron Jobs:**
- Daily adaptation: Run at 3 AM (low traffic)
- Intention triggers: Run every minute (lightweight check)
- Weekly check-ins: Queue processing (avoid blocking)

**Background Jobs (Bull Queue):**
- Profile adaptation (long-running calculation)
- Check-in trigger evaluation (for large user bases)
- Analytics aggregation

### 11.3 Error Handling

**Fallback Strategies:**
- If profile not found → Use default SRS behavior
- If adaptive query fails → Fall back to standard due reviews
- If onboarding incomplete → Prompt to complete, allow app usage

**Graceful Degradation:**
- If Redis cache unavailable → Query database directly
- If cron job fails → Manual trigger via admin endpoint
- If adaptation calculation errors → Maintain last known good config

---

## 12. Testing Strategy

### 12.1 Unit Tests

**UserMemoryService:**
- `createProfileFromOnboarding()` - Validates all profile fields created correctly
- `getPersonalizedReviewConfig()` - Validates skill/pace/style adjustments
- `adaptReviewParameters()` - Validates interval multiplier calculations
- `getAdaptiveDueReviews()` - Validates ordering logic per learning style

**ImplementationIntentionsService:**
- `shouldTriggerToday()` - Validates frequency logic (DAILY, WEEKDAYS, CUSTOM)
- `handleMiss()` - Validates escalation (1st → 2hr, 2nd → 24hr, 3rd → pause)
- `calculateNextTrigger()` - Validates time-based scheduling

### 12.2 Integration Tests

**Onboarding Flow:**
- Test complete onboarding → Profile, config, and intention created
- Test partial onboarding → Only mandatory fields required
- Test profile updates after onboarding

**Adaptive Review Flow:**
- Test review submission → Personalized interval calculation
- Test daily adaptation → Multiplier adjustment based on performance
- Test adaptive ordering → Correct prioritization per learning style

**Implementation Intentions:**
- Test time trigger → Notification created at correct time
- Test miss handling → Escalation flow (2hr → 24hr → pause)
- Test completion → Counter incremented, miss reset

### 12.3 E2E Tests (Playwright)

**User Journeys:**
1. New user onboarding → Daily dashboard → Review session → Check-in
2. Existing user → Weekly check-in modal → Profile adjustment → Continue reviews
3. Intention setup → Trigger at specified time → Mark complete
4. Missed intention → Receive follow-up reminder → Reschedule

---

## 13. Migration & Rollout Plan

### 13.1 Database Migration

**Step 1:** Create new tables (UserMemoryProfile, ImplementationIntention, etc.)
```bash
cd apps/api
npx prisma migrate dev --name add_user_memory_system
npx prisma generate
```

**Step 2:** Backfill existing users with default profiles (optional migration script)
```typescript
// apps/api/prisma/migrations/backfill-profiles.ts
async function backfillProfiles() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    await prisma.userMemoryProfile.create({
      data: {
        userId: user.id,
        learningStyle: LearningStyle.MIXED,
        skillLevel: SkillLevel.INTERMEDIATE,
        primaryGoal: PrimaryGoal.RETENTION,
        preferredPace: PreferredPace.MODERATE,
        dailyTimeCommitment: 10,
        onboardingCompleted: false, // Prompt existing users to complete onboarding
      },
    });
  }
}
```

### 13.2 Phased Rollout

**Week 1-2:** Backend foundation + database schema
**Week 3-4:** Onboarding flow (50% of new users via feature flag)
**Week 5-6:** Adaptive content (enable for users who completed onboarding)
**Week 7-8:** Implementation intentions (opt-in beta)
**Week 9+:** Full rollout + refinement based on metrics

### 13.3 Feature Flags

Use environment variable or database flag to control:
- `ENABLE_ADAPTIVE_REVIEWS` (default: false until validated)
- `ENABLE_IMPLEMENTATION_INTENTIONS` (default: false until validated)
- `ENABLE_WEEKLY_CHECKINS` (default: true)

---

## 14. Documentation & User Education

### 14.1 In-App Help

**Onboarding:**
- "Why do we ask about learning style?" → Tooltip explaining visual vs. hands-on vs. theoretical
- "What is adaptive scheduling?" → Link to help article

**Daily Dashboard:**
- "What are implementation intentions?" → Explain if-then planning with examples
- "How does the system adapt?" → Show adaptation history graph

**Settings:**
- Profile settings page with explanations for each field
- "Reset onboarding" button to re-do questionnaire

### 14.2 User Guides

**Create:**
- "Getting Started with Memory Connector" (includes onboarding walkthrough)
- "Understanding Your Personalized Review Schedule"
- "Setting Up Implementation Intentions (If-Then Plans)"
- "Weekly Check-Ins: Refining Your Profile"

---

## 15. Next Steps & Questions for Stakeholders

### Questions to Consider:

1. **Onboarding Timing:** Should onboarding be mandatory immediately after signup, or allow users to explore first and prompt later?

2. **Implementation Intention Default:** Should we auto-create a default "morning review" intention for all new users, or make it fully opt-in?

3. **Profile Refinement Frequency:** Weekly check-ins may be too frequent for some users. Should we make frequency customizable?

4. **Learning Style Validation:** Should we validate users' self-reported learning style with actual performance data and suggest adjustments?

5. **Admin Controls:** What level of admin visibility do you want into user profiles? (For debugging/support purposes)

6. **Privacy Policy Updates:** Will need to update privacy policy to reflect new profile data collection. Who should draft this?

7. **Mobile Push Notifications:** Implementation intentions require push notifications. Do we have infrastructure for this, or is it in-app only for MVP?

8. **Gamification Integration:** Should adaptive achievements be created? (e.g., "Profile Master: Complete 5 check-ins", "Adaptive Learner: System adapted your schedule 10 times")

---

## 16. Appendix: Reference Mapping to Memory Improvement Doc

### Evidence-Based Methods → Implementation

| Method (from doc) | Implementation |
|------------------|---------------|
| **Spaced repetition** | Personalized SM-2 with `intervalMultiplier` and `optimalReviewInterval` |
| **Retrieval practice** | `preferRecognition` toggle (free recall vs. recognition based on skill level) |
| **Implementation intentions** | `ImplementationIntention` table with if-then phrases and triggers |
| **External memory aids** | Daily dashboard, reminders, projects/topics for organization |
| **Errorless learning** | `preferRecognition=true` for beginners (guided prompts) |
| **Dual coding** | Prioritize image-enriched memories for VISUAL learners |
| **Elaborative encoding** | Future: Add elaboration prompts for THEORETICAL learners |
| **Contextual cues** | `showContext` setting (location, person, time during reviews) |
| **Habit formation** | Daily check-in tracking, streaks (existing gamification) |

### MVP Features → Implementation Status

| MVP Feature (from doc) | Implementation Plan |
|----------------------|-------------------|
| **1. Smart reminders with if-then plans** | ✅ Phase 3 (Week 5-6) - `ImplementationIntention` table + service |
| **2. Daily check-in dashboard** | ✅ Phase 2 (Week 3-4) - `DailyCheckIn` table + dashboard page |
| **3. Gentle missed-task recovery** | ✅ Phase 3 (Week 5-6) - Escalation logic in `handleMiss()` |

### Adaptive Algorithms → Implementation

| Algorithm (from doc) | Implementation |
|---------------------|---------------|
| **Spaced repetition parameters** | `AdaptiveReviewConfig` (initialInterval=1d, ease=2.3, max=30d) |
| **Reminder rescheduling** | `ImplementationIntention.firstReminderMinutes` (0), `secondReminderMinutes` (120), `thirdReminderMinutes` (1440) |
| **Context adaptation** | Location-based intentions (80% accuracy threshold) - Future enhancement |

---

**End of Design Document**

*This comprehensive design provides a complete blueprint for implementing an evidence-based, adaptive user memory and personalization system for Memory Connector. All components are designed to integrate seamlessly with existing architecture while maintaining code quality, performance, and user privacy.*
