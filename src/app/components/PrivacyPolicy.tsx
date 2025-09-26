"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center w-[100vw] mx-0 px-4 py-0 text-gray-800">
      <div className="border-solid border-[0.5px] rounded-sm border-gray-800 my-2 pb-4 bg-white h-full">
        <header className="flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-50">
          <div className="absolute left-6 md:left-16 lg:left-16 top-3 z-98 hidden md:inline-block lg:inline-block">
            <Image
              onClick={() => router.push("/")}
              className="cursor-pointer opacity-70 w-[60px] h-[60px] md:w-[70px] md:h-[70px] lg:w-[80px] lg:h-[80px] drop-shadow-lg transition-transform duration-700 hover:scale-105"
              width={100}
              height={100}
              src="/favicon.png"
              alt="Logo"
            />
          </div>
          {/*  */}
          <Image
            onClick={() => router.push("/")}
            className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] drop-shadow-lg opacity-90 mb-0 block md:hidden lg:hidden"
            width={100}
            height={100}
            src="/favicon.png"
            alt="Logo"
          />
          <h1 className="text-3xl font-bold px-4 text-center md:mr-10">
            Privacy Policy
          </h1>
        </header>

        <div className="mx-auto py-4 px-4 md:px-16 flex flex-col md:flex-row gap-10 mb-0 bg-white">
          {/* Table of Contents */}
          <div className="w-full md:w-1/4">
            <div className="border border-gray-300 rounded p-4 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#intro" className="text-blue-600 hover:underline">
                    Your Privacy Matters
                  </a>
                </li>
                <li>
                  <a href="#info" className="text-blue-600 hover:underline">
                    1. Information We Collect
                  </a>
                </li>
                <li>
                  <a href="#use" className="text-blue-600 hover:underline">
                    2. How We Use Your Information
                  </a>
                </li>
                <li>
                  <a
                    href="#protection"
                    className="text-blue-600 hover:underline"
                  >
                    3. Data Protection
                  </a>
                </li>
                <li>
                  <a href="#cookies" className="text-blue-600 hover:underline">
                    4. Cookies
                  </a>
                </li>
                <li>
                  <a href="#rights" className="text-blue-600 hover:underline">
                    5. Your Rights
                  </a>
                </li>
                <li>
                  <a href="#changes" className="text-blue-600 hover:underline">
                    6. Changes to This Policy
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-blue-600 hover:underline">
                    7. Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="w-full md:w-3/4">
            <div className="mb-4 mt-2 text-sm">
              <p className="italic">Effective Date: July 26, 2025</p>
              <p
                id="intro"
                className="text-base font-semibold mt-2 scroll-mt-50"
              >
                Your Privacy Matters
              </p>
            </div>

            <p className="mb-4">
              Our mission is to improve your valet experience by offering a
              secure, fast, and efficient way to drop off and retrieve your
              vehicle. As part of this service, we collect and use some of your
              personal data. We value your privacy, and this policy explains how
              we handle your data.
            </p>

            <p className="mb-4">
              This Privacy Policy applies when you use our valet services
              through our app or website. It explains what data we collect, how
              we use it, and your rights regarding that data. Our aim is to be
              transparent about how your data is stored, transmitted, and
              protected.
            </p>

            <h2
              id="info"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              1. Information We Collect
            </h2>
            <p className="mb-4">
              We may collect personal information such as your name, mobile
              number, vehicle details, location data, and timestamps related to
              your vehicle drop-off and pick-up. We may also collect your email
              address, IP address, device type, and any other data you
              voluntarily provide through our platform.
            </p>

            <h2
              id="use"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              2. How We Use Your Information
            </h2>
            <p className="mb-4">
              Your data is used to operate our services, communicate with you,
              and enhance your experience. Specifically, this includes sending
              timely updates via SMS or app notifications (e.g., when your car
              is received, parked, or ready for pick-up). We also use device
              usage data to improve security and app performance.
            </p>

            <p className="mb-4">
              We do not sell your personal information to third parties.
              However, we may share data with trusted service providers strictly
              for operational purposes, such as SMS delivery platforms.
            </p>

            <h2
              id="protection"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              3. Data Protection
            </h2>
            <p className="mb-4">
              All communications are encrypted and stored securely. We implement
              industry-standard security measures to protect your personal data
              from unauthorized access, misuse, or disclosure.
            </p>

            <h2
              id="cookies"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              4. Cookies
            </h2>
            <p className="mb-4">
              Our website may use cookies to enhance your experience and gather
              usage analytics. You can disable cookies in your browser settings
              at any time.
            </p>

            <h2
              id="rights"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              5. Your Rights
            </h2>
            <p className="mb-4">
              You have the right to access, correct, or delete your personal
              data at any time by contacting our support team. For more details,
              you may refer to our Cookie Policy and Data Settings or reach out
              via our help page.
            </p>

            <h2
              id="changes"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              6. Changes to This Policy
            </h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with the updated effective date.
            </p>

            <h2
              id="contact"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-50"
            >
              7. Contact Us
            </h2>
            <p>
              If you have any questions or concerns about this Privacy Policy,
              please contact us at{" "}
              <a
                href="mailto:services@synergyppr.com"
                className="text-blue-600 underline"
              >
                services@synergyppr.com
              </a>
              .
            </p>
            <div className="mt-6">
              <p>
                Read our{" "}
                <a
                  className="text-blue-600 underline"
                  href="/terms-and-conditions"
                  target="_blank"
                >
                  Terms & Conditions
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
