import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Need help accessing your account?
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Mail className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Contact Administrator</h3>
              <p className="mt-2 text-sm text-gray-600">
                To reset your password, please contact the system administrator at:
              </p>
              <a
                href="mailto:admin@memoryconnector.com"
                className="mt-2 inline-block text-blue-600 hover:text-blue-500 font-medium"
              >
                admin@memoryconnector.com
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Include in your email:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Your registered email address</li>
              <li>Reason for password reset</li>
              <li>Any additional context that might help verify your identity</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> For security purposes, password resets are handled manually by our
              administrators. You should receive a response within 24 hours.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
