// app/login/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/authOptions";
import LoginForm from "./components/LoginForm";
import Image from "next/image";
import { KeySquare } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session?.user?.email) redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pt-6">
      <div className="absolute inset-0">
        <Image
          src="/background.jpeg"
          alt="Background"
          className="h-full w-full object-cover"
          width={1200}
          height={900}
          priority
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md rounded-4xl border border-white/30 bg-white/90 px-6 pb-8 pt-24 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-amber-200 bg-linear-gradient-to-tr from-amber-100 to-amber-50 
            shadow-[0_20px_50px_rgba(15,23,42,0.25)] bg-white">
              <KeySquare className="h-14 w-14 text-amber-500" />
            </div>
          </div>

          <div className="mb-2 text-center mx-4">
            <span className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 shadow-sm">
              Secure Access
            </span>

            <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
              Parkey Valet
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to manage check-ins, vehicles, and valet operations.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
