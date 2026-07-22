// app/login/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { KeySquare } from "lucide-react";

import { authOptions } from "./auth/authOptions";
import LoginForm from "./components/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="absolute inset-0">
        <Image
          src="/background.jpeg"
          alt="Valet parking background"
          className="h-full w-full object-cover"
          width={1200}
          height={900}
          priority
        />

        <div className="absolute inset-0 bg-slate-950/60" />

        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_55%)]
          "
        />

        <div
          className="
            absolute inset-0 opacity-25 transition-colors duration-500
            bg-[radial-gradient(circle_at_top_right,var(--primary-light),transparent_42%)]
          "
        />
      </div>

      {/* <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeSelector />
      </div> */}

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24 sm:py-20">
        <div
          className="relative w-full max-w-md rounded-4xl border border-white/30 bg-white/90 px-6 pb-8 pt-24 shadow-[0_30px_90px_rgba(15,23,42,0.35)] 
          backdrop-blur-xl"
        >
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-(--primary-light) bg-white
                shadow-[0_20px_50px_rgba(15,23,42,0.25)] transition-colors duration-500"
            >
              <div className="absolute inset-2 rounded-full bg-linear-to-tr from-(--primary-soft) to-(--secondary-soft)" />

              <KeySquare className="relative z-10 h-14 w-14 text-primary transition-colors duration-500" />
            </div>
          </div>

          <div className="mx-4 mb-2 text-center">
            <span
              className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-bold uppercase
              tracking-[0.18em] text-primary shadow-sm transition-colors duration-500"
            >
              Secure Access
            </span>

            <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
              Parkey
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to manage check-ins, vehicles, and valet operations.
            </p>
          </div>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
