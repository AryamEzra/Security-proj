import React from "react";
import Link from "next/link";

type Props = {
  showPwPopup: boolean;
  pwPopupMessage: string;
  showUserExistsPopup: boolean;
  userExistsMsg: string;
};

export default function SignUpToasts({ showPwPopup, pwPopupMessage, showUserExistsPopup, userExistsMsg }: Props) {
  return (
    <>
      {/* Weak-password popup (toast) */}
      {showPwPopup && (
        <div
          role="alert"
          className="fixed left-1/2 top-[66%] transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-11/12 bg-blue-50 border border-blue-300 text-blue-900 p-4 rounded shadow-lg"
        >
          <div className="font-medium">Weak password</div>
          <div className="text-sm mt-1">{pwPopupMessage}</div>
        </div>
      )}

      {/* User exists popup (toast) */}
      {showUserExistsPopup && (
        <div
          role="alert"
          className="fixed left-1/2 top-[55%] transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-11/12 bg-blue-50 border border-blue-300 text-blue-900 p-4 rounded shadow-lg"
        >
          <div className="font-medium">User exists</div>
          <div className="text-sm mt-1">{userExistsMsg}</div>
          <div className="text-xs mt-2 text-right">
            <Link href="/login" className="underline">
              Go to login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
