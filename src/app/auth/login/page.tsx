import { Suspense } from "react";

import Logo from "@/components/logo";

import { LoginForm } from "../_components/login-form";
import { LoginMagicLinkError } from "../_components/login-magic-link-error";

export default function LoginPage() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-[#281121] lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <div className="mb-10">
              <Logo />
            </div>

            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">Hello again</h1>
              <p className="text-primary-foreground/80 text-xl">Login to continue</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Login</div>
            <div className="mx-auto max-w-xl text-muted-foreground">Welcome back. Enter your email address.</div>
          </div>
          <div className="space-y-4">
            <Suspense fallback={null}>
              <LoginMagicLinkError />
            </Suspense>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
