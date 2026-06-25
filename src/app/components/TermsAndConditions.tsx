// TermsAndConditions.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { KeySquare } from "lucide-react";

export default function TermsAndConditions() {
  const router = useRouter();

  const tocItems = [
    ["intro", "Introduction"],
    ["use", "1. Use of Service"],
    ["messaging", "2. Messaging"],
    ["liability", "3. Liability"],
    ["modifications", "4. Modifications"],
    ["termination", "5. Termination"],
    ["contact", "6. Contact Us"],
  ];

  return (
    <main className="min-h-screen bg-[#f8f5ed] px-4 py-8 text-slate-800">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(214,168,0,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl border border-amber-200/70 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-linear-to-br from-white via-amber-50/70 to-white px-5 py-6 md:px-8">
          <div className="flex flex-col items-center gap-4 text-center md:grid md:grid-cols-[25%_75%] md:text-left">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-3 rounded-full border border-amber-200 bg-white px-4 py-2 shadow-sm transition hover:bg-amber-50 max-w-50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)]">
                <KeySquare className="h-5 w-5" />
              </div>

              <span className="font-serif text-2xl font-bold text-amber-600">
                Parkey
              </span>
            </button>

            <div>
              <span className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
                Legal
              </span>

              <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">
                Terms & Conditions
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Please review the terms governing your use of our valet parking
                app and related services.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 px-5 py-8 md:grid-cols-[280px_1fr] md:px-8">
          <aside className="md:sticky md:top-36 md:self-start">
            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Table of Contents
              </p>

              <ul className="space-y-2 text-sm">
                {tocItems.map(([href, label]) => (
                  <li key={href}>
                    <a
                      href={`#${href}`}
                      className="flex rounded-2xl px-4 py-3 font-bold text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <LegalSection id="intro">
              <p>
                These Terms and Conditions (&quot;Terms&quot;) govern your use
                of our valet parking mobile app and related services
                (&quot;Service&quot;). By accessing or using our Service, you
                agree to these Terms. Please read them carefully.
              </p>
            </LegalSection>

            <LegalSection id="use" title="1. Use of Service">
              <p>
                You must be at least 18 years old to use our valet service. By
                using the app, you agree to provide accurate and up-to-date
                information. Our app is designed to facilitate smooth vehicle
                drop-off and retrieval and to communicate with you regarding the
                status of your vehicle. You agree not to misuse the app or
                disrupt the service in any way.
              </p>
            </LegalSection>

            <LegalSection id="messaging" title="2. Messaging">
              <p>
                By using the app, you consent to receive automated text messages
                or notifications regarding the status of your vehicle. These
                messages may include updates when your car is received, being
                parked, or ready for pickup. Message and data rates may apply
                depending on your carrier.
              </p>
            </LegalSection>

            <LegalSection id="liability" title="3. Liability">
              <p>
                While we strive to provide a secure and professional valet
                experience, we are not liable for any damage, loss, or theft
                occurring to vehicles unless caused by gross negligence or
                misconduct by our staff. We encourage you not to leave personal
                belongings inside your vehicle when using the valet service.
              </p>
            </LegalSection>

            <LegalSection id="modifications" title="4. Modifications">
              <p>
                We reserve the right to update or modify these Terms at any time
                without prior notice. Continued use of the Service after changes
                means you accept the revised terms.
              </p>
            </LegalSection>

            <LegalSection id="termination" title="5. Termination">
              <p>
                We may suspend or terminate your access to the Service if you
                violate these Terms or engage in any harmful conduct.
              </p>
            </LegalSection>

            <LegalSection id="contact" title="6. Contact Us">
              <p>
                If you have any questions about these Terms or our{" "}
                <a
                  className="font-bold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-800"
                  href="privacy-policy"
                  target="_blank"
                >
                  Privacy Policy
                </a>
                , please contact our support team at{" "}
                <a
                  href="mailto:services@synergyppr.com"
                  className="font-bold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-800"
                >
                  services@synergyppr.com
                </a>
                .
              </p>
            </LegalSection>
          </section>
        </div>
      </div>
    </main>
  );
}

function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-40 border-b border-slate-200 py-6 last:border-b-0">
      {title && (
        <h2 className="mb-3 font-serif text-2xl font-bold text-slate-950">
          {title}
        </h2>
      )}

      <div className="text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}