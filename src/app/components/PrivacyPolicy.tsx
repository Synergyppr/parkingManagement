// PrivacyPolicy.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { KeySquare } from "lucide-react";

export default function PrivacyPolicy() {
  const router = useRouter();

  const tocItems = [
    ["intro", "Your Privacy Matters"],
    ["info", "1. Information We Collect"],
    ["use", "2. How We Use Your Information"],
    ["protection", "3. Data Protection"],
    ["cookies", "4. Cookies"],
    ["rights", "5. Your Rights"],
    ["changes", "6. Changes to This Policy"],
    ["contact", "7. Contact Us"],
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
              className="flex items-center gap-3 rounded-full border border-amber-200 bg-white px-4 py-2 shadow-sm transition hover:bg-amber-50 
              cursor-pointer max-w-50"
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
                Privacy Policy
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Learn how we collect, use, store, and protect information
                related to your valet parking experience.
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
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                Effective Date
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                July 26, 2025
              </p>
            </div>

            <LegalSection id="intro" title="Your Privacy Matters">
              <p>
                Our mission is to improve your valet experience by offering a
                secure, fast, and efficient way to drop off and retrieve your
                vehicle. As part of this service, we collect and use some of
                your personal data. We value your privacy, and this policy
                explains how we handle your data.
              </p>

              <p className="mt-4">
                This Privacy Policy applies when you use our valet services
                through our app or website. It explains what data we collect,
                how we use it, and your rights regarding that data. Our aim is
                to be transparent about how your data is stored, transmitted,
                and protected.
              </p>
            </LegalSection>

            <LegalSection id="info" title="1. Information We Collect">
              <p>
                We may collect personal information such as your name, mobile
                number, vehicle details, location data, and timestamps related
                to your vehicle drop-off and pick-up. We may also collect your
                email address, IP address, device type, and any other data you
                voluntarily provide through our platform.
              </p>
            </LegalSection>

            <LegalSection id="use" title="2. How We Use Your Information">
              <p>
                Your data is used to operate our services, communicate with you,
                and enhance your experience. Specifically, this includes sending
                timely updates via SMS or app notifications, such as when your
                car is received, parked, or ready for pick-up. We also use
                device usage data to improve security and app performance.
              </p>

              <p className="mt-4">
                We do not sell your personal information to third parties.
                However, we may share data with trusted service providers
                strictly for operational purposes, such as SMS delivery
                platforms.
              </p>
            </LegalSection>

            <LegalSection id="protection" title="3. Data Protection">
              <p>
                All communications are encrypted and stored securely. We
                implement industry-standard security measures to protect your
                personal data from unauthorized access, misuse, or disclosure.
              </p>
            </LegalSection>

            <LegalSection id="cookies" title="4. Cookies">
              <p>
                Our website may use cookies to enhance your experience and
                gather usage analytics. You can disable cookies in your browser
                settings at any time.
              </p>
            </LegalSection>

            <LegalSection id="rights" title="5. Your Rights">
              <p>
                You have the right to access, correct, or delete your personal
                data at any time by contacting our support team. For more
                details, you may refer to our Cookie Policy and Data Settings or
                reach out via our help page.
              </p>
            </LegalSection>

            <LegalSection id="changes" title="6. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. Any changes
                will be posted on this page with the updated effective date.
              </p>
            </LegalSection>

            <LegalSection id="contact" title="7. Contact Us">
              <p>
                If you have any questions or concerns about this Privacy Policy,
                please contact us at{" "}
                <a
                  href="mailto:services@synergyppr.com"
                  className="font-bold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-800"
                >
                  services@synergyppr.com
                </a>
                .
              </p>

              <p className="mt-4">
                Read our{" "}
                <a
                  className="font-bold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-800"
                  href="/terms-and-conditions"
                  target="_blank"
                >
                  Terms & Conditions
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
    <section
      id={id}
      className="scroll-mt-40 border-b border-slate-200 py-6 last:border-b-0"
    >
      {title && (
        <h2 className="mb-3 font-serif text-2xl font-bold text-slate-950">
          {title}
        </h2>
      )}

      <div className="text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}
