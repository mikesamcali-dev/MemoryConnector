import { Check } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useAuth } from '../contexts/AuthContext';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function UpgradePage() {
  const { user } = useAuth();
  const currentTier = user?.tier || 'free';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade Your Account</h1>
        <p className="text-xl text-gray-600">
          Choose the plan that's right for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <div className={`bg-white rounded-lg shadow-lg border-2 p-8 ${
          currentTier === 'free' ? 'border-blue-500' : 'border-gray-200'
        }`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
            <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
            <div className="text-gray-600">forever</div>
          </div>

          {currentTier === 'free' && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-center mb-6 font-medium">
              Current Plan
            </div>
          )}

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">10 memories per day</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Basic search</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">AI enrichment (limited)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Memory reminders</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Memory types & linking</span>
            </li>
          </ul>

          {currentTier !== 'free' && (
            <button
              disabled
              className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-md font-medium cursor-not-allowed"
            >
              Downgrade Not Available
            </button>
          )}
        </div>

        {/* Premium Tier */}
        <div className={`bg-white rounded-lg shadow-lg border-2 p-8 ${
          currentTier === 'premium' ? 'border-blue-500' : 'border-gray-200'
        }`}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium w-fit mx-auto mb-4">
            RECOMMENDED
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium</h2>
            <div className="text-4xl font-bold text-gray-900 mb-1">$9.99</div>
            <div className="text-gray-600">per month</div>
          </div>

          {currentTier === 'premium' && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-center mb-6 font-medium">
              Current Plan
            </div>
          )}

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700"><strong>100 memories per day</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700"><strong>Advanced semantic search</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700"><strong>Unlimited AI enrichment</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Priority support</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Export your data</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Advanced analytics</span>
            </li>
          </ul>

          {currentTier === 'free' ? (
            <button
              onClick={() => alert('Payment integration coming soon! For now, contact support to upgrade.')}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Upgrade to Premium
            </button>
          ) : (
            <div className="text-center text-gray-600 font-medium">
              You're already on Premium!
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Need help choosing a plan?
        </h3>
        <p className="text-gray-600 mb-4">
          Contact our support team at{' '}
          <a href="mailto:support@memoryconnector.com" className="text-blue-600 hover:underline">
            support@memoryconnector.com
          </a>
        </p>
        <p className="text-sm text-gray-500">
          All plans include secure cloud storage, automatic backups, and access to new features as they're released.
        </p>
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="upgrade"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}