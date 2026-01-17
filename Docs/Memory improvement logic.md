1. Executive summary

* Prioritize low-friction external memory supports first. Context-aware reminders, calendars, and medication prompts deliver the fastest real-world gains across aging, mild cognitive impairment, ADHD, and everyday forgetfulness.
* Combine reminders with retrieval practice and spaced repetition. This pairing improves retention more than reminders alone while keeping effort manageable.
* Use implementation intentions and if-then plans for prospective memory. These strategies show strong transfer to daily life tasks.
* Default to adaptive, forgiving schedules. Algorithms should adjust spacing, reduce nagging, and recover smoothly from missed sessions.
* Design for accessibility and dignity. Large text, voice input and output, haptics, and neutral language reduce stigma and cognitive load.
* Measure success by daily-life outcomes. Track appointment adherence, medication completion, and task follow-through, not only in-app quizzes.

2. Evidence-based methods

* Spaced repetition. Repeated review at expanding intervals improves long-term retention across ages. Benefits remain for older adults and mild cognitive impairment when intervals adapt to performance and effort stays low.
* Retrieval practice. Actively recalling information strengthens memory more than rereading. Short prompts and recognition-based options suit mobile use and cognitive limitations.
* Implementation intentions. If-then planning improves prospective memory and task execution. Effects are robust for older adults and ADHD when cues are concrete and timely.
* External memory aids and cognitive offloading. Calendars, reminders, and notes reliably improve everyday functioning. These supports reduce reliance on impaired internal memory.
* Errorless learning. Preventing mistakes during early learning supports people with cognitive impairment. Guided prompts and multiple-choice recall reduce frustration.
* Dual coding. Combining brief text with images or icons improves recall, especially for names, places, and routines.
* Elaborative encoding. Asking for simple meaning-based links improves retention. Prompts must remain short to avoid overload.
* Contextual cues. Location, time, and activity-linked reminders improve prospective memory. Effects depend on permission and accurate sensing.
* Habit formation. Repeated cue-routine-reward loops stabilize routines like medication taking. Consistency matters more than intensity.
* Mnemonics. Techniques like imagery and acronyms help some users. These suit optional training modules rather than defaults.

3. Prioritized feature list

MVP features

1. Smart reminders with if-then plans
   Description. Time- and context-based reminders paired with a short if-then statement.
   Scientific rationale. Strong evidence for prospective memory support and transfer.
   User stories.

* Older adult remembers medications when waking.
* Adult with ADHD completes tasks when arriving at work.
  UX flow.

1. Select task.

2. Choose trigger: time, location, routine.

3. Generate or edit if-then phrase.

4. Confirm reminder style.
   Required inputs. Task name, trigger, optional location.
   Personalization parameters. Reminder frequency default once, escalation after miss, tone neutral.
   Low-effort fallback. Simple time reminder without if-then text.
   Sample microcopy. “If it’s 8 AM, take blood pressure pill.”
   Accessibility notes. Voice setup, large buttons, haptic alert.
   Implementation complexity. Medium.

5. Daily check-in dashboard
   Description. Single screen showing today’s tasks and reminders.
   Scientific rationale. Reduces cognitive load and supports external memory.
   User stories.

* User reviews day in under 30 seconds.
  UX flow.

1. Open app.

2. See list sorted by urgency.

3. Swipe to mark done or snooze.
   Required inputs. Task list.
   Personalization parameters. Sorting by time or priority.
   Low-effort fallback. Read-only view.
   Sample microcopy. “Today’s focus.”
   Accessibility notes. High contrast, large text.
   Implementation complexity. Low.

4. Gentle missed-task recovery
   Description. Non-judgmental prompts after missed reminders.
   Scientific rationale. Reduces disengagement and supports habit recovery.
   User stories.

* User resumes after forgetting.
  UX flow.

1. Detect miss.
2. Offer reschedule or simplify.
   Required inputs. Task history.
   Personalization parameters. Delay before follow-up default 2 hours.
   Low-effort fallback. Silent reschedule.
   Sample microcopy. “Still relevant? Reschedule or skip.”
   Accessibility notes. Clear language, no alarms.
   Implementation complexity. Low.

Phase 2 features

4. Adaptive spaced review for key info
   Description. Short reviews of names, routines, or facts tied to reminders.
   Scientific rationale. Spaced repetition and retrieval practice improve retention.
   User stories.

* User recalls new coworker names.
  UX flow.

1. Capture item.

2. First review after creation.

3. Adaptive follow-ups.
   Required inputs. Text or image.
   Personalization parameters. Initial interval 1 day, max interval 30 days.
   Low-effort fallback. Recognition-based review.
   Sample microcopy. “Who is this?”
   Accessibility notes. Image zoom, audio labels.
   Implementation complexity. Medium.

4. Medication and routine streaks
   Description. Visual streaks for consistent completion.
   Scientific rationale. Habit formation and reinforcement.
   User stories.

* User maintains daily routine.
  UX flow.

1. Mark done.
2. See streak count.
   Required inputs. Completion logs.
   Personalization parameters. Streak visibility on or off.
   Low-effort fallback. No streaks shown.
   Sample microcopy. “3 days in a row.”
   Accessibility notes. Color plus text cues.
   Implementation complexity. Low.

Phase 3 features

6. Multimodal memory capture
   Description. Save notes with text, voice, and image together.
   Scientific rationale. Dual coding and elaboration.
   User stories.

* User remembers where an item was placed.
  UX flow.

1. Capture photo.

2. Add short voice note.
   Required inputs. Media.
   Personalization parameters. Default media type.
   Low-effort fallback. Text only.
   Sample microcopy. “Add a photo or note.”
   Accessibility notes. Voice-first option.
   Implementation complexity. High.

3. Optional coach or caregiver sharing
   Description. Share selected reminders or progress.
   Scientific rationale. Social accountability improves adherence.
   User stories.

* Care partner monitors medications.
  UX flow.

1. Opt-in.

2. Select items to share.
   Required inputs. Contact permission.
   Personalization parameters. Sharing scope.
   Low-effort fallback. No sharing.
   Sample microcopy. “Share progress?”
   Accessibility notes. Clear consent screens.
   Implementation complexity. High.

3. Adaptive scheduling and algorithms

Spaced repetition algorithm
Model. Performance-based expanding intervals.
Parameters.

* Initial interval: 1 day.
* Ease factor default: 2.3.
* Max interval: 30 days.
  Update rule.
* Success increases interval by factor.
* Failure halves interval and offers recognition mode.

Pseudocode.
interval = previous_interval * ease
if fail then interval = max(1, previous_interval / 2)

Reminder rescheduling
Rules.

* First miss triggers gentle check-in after 2 hours.
* Repeated misses reduce frequency and suggest simplification.
* Three consecutive misses pause reminders and prompt review.

Context adaptation

* Location accuracy threshold default 80 percent.
* Fallback to time-based reminder if confidence drops.

5. Training exercises and content examples

* Name recall drill. Show face photo, ask for name, then reveal. Score correct or partial.
  Prompt. “What is this person’s name?”

* Prospective memory practice. Simulated task with delayed reminder.
  Prompt. “When the timer ends, tap Done.”

* Elaboration prompt. One-question meaning link.
  Prompt. “What does this help with?”

* Mnemonic builder. Optional guided imagery.
  Prompt. “Picture the item in a bright color.”

6. Measurement and experiments

Key metrics

* Task completion rate.
* Medication adherence.
* Reminder dismissal without action.
* Retention at 7 and 30 days.
* Self-report confidence scale.

A/B test ideas

1. If-then phrasing vs simple reminder. Hypothesis: higher completion.

2. Recognition vs free recall. Hypothesis: lower drop-off.

3. Haptic plus sound vs sound only. Hypothesis: faster response.

4. Streaks visible vs hidden. Hypothesis: improved adherence.

5. Gentle language vs neutral. Hypothesis: better retention.

6. Context-aware vs time-only reminders. Hypothesis: fewer misses.

7. Privacy, accessibility, and ethical considerations

* Local-first data storage with encryption.
* Explicit consent for sensors and sharing.
* Large text, adjustable contrast, voice input and output.
* Neutral language to avoid stigma.
* Easy data export and deletion.

8. Roadmap and implementation plan

MVP. 3 to 4 months. Focus on reminders, dashboard, recovery. Weekly usability tests.
Phase 2. 3 months. Add adaptive review and streaks. Biweekly experiments.
Phase 3. 6 months. Multimodal capture and sharing. Pilot with small cohorts.

9. Selected references

* Ebbinghaus, 1885. Foundations of forgetting curves and spacing.
* Cepeda et al., 2006. Meta-analysis on spaced repetition benefits.
* Roediger and Karpicke, 2006. Evidence for retrieval practice.
* Gollwitzer, 1999. Implementation intentions and behavior change.
* McDaniel and Einstein, 2007. Prospective memory frameworks.
* Clare and Jones, 2008. Errorless learning in cognitive impairment.
* Paivio, 1991. Dual coding theory.
* Lally et al., 2010. Habit formation timelines.
