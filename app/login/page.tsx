"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <SignIn routing="hash" forceRedirectUrl="/dashboard" />
    </div>
  );
}
