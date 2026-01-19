import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

type LearningStyle = 'VISUAL' | 'HANDS_ON' | 'THEORETICAL' | 'MIXED';
type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type PrimaryGoal = 'RETENTION' | 'LEARNING' | 'ORGANIZATION' | 'HABIT_BUILDING';
type PreferredPace = 'INTENSIVE' | 'MODERATE' | 'GRADUAL';

interface OnboardingAnswers {
  learningStyle: LearningStyle | null;
  skillLevel: SkillLevel | null;
  primaryGoal: PrimaryGoal | null;
  dailyTimeCommitment: number | null;
  preferredPace: PreferredPace | null;
  preferredReviewTime: string | null;
  areasOfInterest: string[];
  enableReminders: boolean;
}

export function OnboardingQuestionnairePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [answers, setAnswers] = useState<OnboardingAnswers>({
    learningStyle: null,
    skillLevel: null,
    primaryGoal: null,
    dailyTimeCommitment: null,
    preferredPace: null,
    preferredReviewTime: null,
    areasOfInterest: [],
    enableReminders: true,
  });

  const totalSteps = 7;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/user-memory/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(answers),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Onboarding failed' }));
        throw new Error(errorData.message || 'Failed to complete onboarding');
      }

      // Redirect to app
      navigate('/app/capture');
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return answers.learningStyle !== null;
      case 2:
        return answers.skillLevel !== null;
      case 3:
        return answers.primaryGoal !== null;
      case 4:
        return answers.dailyTimeCommitment !== null;
      case 5:
        return answers.preferredPace !== null;
      case 6:
        return true; // Optional fields
      case 7:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Personalize Your Experience</h1>
          <p className="text-gray-600">
            Help us tailor Memory Connector to your learning style
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx + 1 === currentStep
                    ? 'w-8 bg-purple-600'
                    : idx + 1 < currentStep
                    ? 'w-2 bg-purple-400'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Learning Style */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How do you learn best?</h2>
              <p className="text-gray-600 mb-6">Choose the style that resonates most with you.</p>
              <div className="space-y-3">
                {[
                  { value: 'VISUAL', label: 'Visual', desc: 'Images, diagrams, and visual mnemonics help me remember' },
                  { value: 'HANDS_ON', label: 'Hands-On', desc: 'Interactive practice and real-world application work best' },
                  { value: 'THEORETICAL', label: 'Theoretical', desc: 'Deep understanding and conceptual connections are key' },
                  { value: 'MIXED', label: 'Mixed', desc: 'I benefit from a balanced combination of approaches' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAnswers({ ...answers, learningStyle: option.value as LearningStyle })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers.learningStyle === option.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Skill Level */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your experience level?</h2>
              <p className="text-gray-600 mb-6">This helps us provide the right level of guidance.</p>
              <div className="space-y-3">
                {[
                  { value: 'BEGINNER', label: 'Beginner', desc: 'New to memory techniques and spaced repetition' },
                  { value: 'INTERMEDIATE', label: 'Intermediate', desc: 'Some experience with memory systems' },
                  { value: 'ADVANCED', label: 'Advanced', desc: 'Experienced with advanced memory techniques' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAnswers({ ...answers, skillLevel: option.value as SkillLevel })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers.skillLevel === option.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Primary Goal */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your main goal?</h2>
              <p className="text-gray-600 mb-6">We'll optimize your experience for this objective.</p>
              <div className="space-y-3">
                {[
                  { value: 'RETENTION', label: 'Long-term Retention', desc: 'Never forget important information' },
                  { value: 'LEARNING', label: 'Fast Learning', desc: 'Acquire new knowledge quickly' },
                  { value: 'ORGANIZATION', label: 'Organization', desc: 'Structure and connect information effectively' },
                  { value: 'HABIT_BUILDING', label: 'Build Habits', desc: 'Develop consistent daily review routines' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAnswers({ ...answers, primaryGoal: option.value as PrimaryGoal })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers.primaryGoal === option.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Daily Time Commitment */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How much time can you dedicate daily?</h2>
              <p className="text-gray-600 mb-6">Be realistic - consistency matters more than duration.</p>
              <div className="space-y-3">
                {[
                  { value: 5, label: '5 minutes', desc: 'Quick daily check-ins' },
                  { value: 10, label: '10 minutes', desc: 'Balanced daily practice' },
                  { value: 15, label: '15 minutes', desc: 'Regular engagement' },
                  { value: 30, label: '30 minutes', desc: 'Dedicated learning time' },
                  { value: 60, label: '60+ minutes', desc: 'Intensive study sessions' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAnswers({ ...answers, dailyTimeCommitment: option.value })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers.dailyTimeCommitment === option.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Preferred Pace */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What pace works best for you?</h2>
              <p className="text-gray-600 mb-6">This affects how often you'll review memories.</p>
              <div className="space-y-3">
                {[
                  { value: 'INTENSIVE', label: 'Intensive', desc: 'High daily volume with frequent reviews' },
                  { value: 'MODERATE', label: 'Moderate', desc: 'Balanced workload with standard intervals' },
                  { value: 'GRADUAL', label: 'Gradual', desc: 'Lower volume with longer intervals' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAnswers({ ...answers, preferredPace: option.value as PreferredPace })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers.preferredPace === option.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Optional Preferences */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">A few more preferences</h2>
              <p className="text-gray-600 mb-6">These are optional but help personalize your experience.</p>
              <div className="space-y-6">
                {/* Preferred Review Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Best time to review (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['morning', 'afternoon', 'evening', 'flexible'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setAnswers({ ...answers, preferredReviewTime: time })}
                        className={`p-3 rounded-lg border-2 transition-all capitalize ${
                          answers.preferredReviewTime === time
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enable Reminders */}
                <div>
                  <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.enableReminders}
                      onChange={(e) => setAnswers({ ...answers, enableReminders: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Enable review reminders</div>
                      <div className="text-sm text-gray-600">Get notified when it's time to review</div>
                    </div>
                  </label>
                </div>

                {/* Areas of Interest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of interest (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Work & Professional',
                      'People & Relationships',
                      'Health & Wellness',
                      'Learning & Education',
                      'Hobbies & Interests',
                      'Personal Development',
                    ].map((area) => (
                      <button
                        key={area}
                        onClick={() => {
                          const newAreas = answers.areasOfInterest.includes(area)
                            ? answers.areasOfInterest.filter((a) => a !== area)
                            : [...answers.areasOfInterest, area];
                          setAnswers({ ...answers, areasOfInterest: newAreas });
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-sm ${
                          answers.areasOfInterest.includes(area)
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review & Submit */}
          {currentStep === 7 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All set!</h2>
              <p className="text-gray-600 mb-6">Review your preferences below.</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Learning Style: </span>
                  <span className="text-sm text-gray-900">{answers.learningStyle?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Skill Level: </span>
                  <span className="text-sm text-gray-900">{answers.skillLevel}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Primary Goal: </span>
                  <span className="text-sm text-gray-900">{answers.primaryGoal?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Daily Time: </span>
                  <span className="text-sm text-gray-900">{answers.dailyTimeCommitment} minutes</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Pace: </span>
                  <span className="text-sm text-gray-900">{answers.preferredPace}</span>
                </div>
                {answers.preferredReviewTime && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Review Time: </span>
                    <span className="text-sm text-gray-900 capitalize">{answers.preferredReviewTime}</span>
                  </div>
                )}
                {answers.areasOfInterest.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Interests: </span>
                    <span className="text-sm text-gray-900">{answers.areasOfInterest.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Don't worry - you can always adjust these preferences later in your settings.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="ml-auto flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
