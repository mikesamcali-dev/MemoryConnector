import { Mail, ArrowLeft, Shield } from 'lucide-react';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Admin Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Password Reset</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Admin Password</h2>
            <p className="text-sm text-gray-600">
              Need help accessing your admin account?
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <Mail className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900">Contact System Owner</h3>
              <p className="mt-2 text-sm text-gray-600">
                For admin password resets, contact the system owner at:
              </p>
              <a
                href="mailto:mike@prophet21tools.com"
                className="mt-2 inline-block text-blue-600 hover:text-blue-500 font-medium"
              >
                mike@prophet21tools.com
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Include in your request:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Your admin email address</li>
              <li>Reason for password reset</li>
              <li>Verification information (if applicable)</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-4">
            <p className="text-sm text-amber-900">
              <strong>Security Note:</strong> Admin password resets require manual verification and
              authorization from the system owner. This helps protect the admin panel from unauthorized access.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/login"
            className="inline-flex items-center text-sm text-gray-400 hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to admin login
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>&copy; 2024 Memory Connector. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
