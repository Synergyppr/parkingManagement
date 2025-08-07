"use client";
import React from "react";
import Image from "next/image";

export default function TermsAndConditions() {
  return (
    <div className="flex flex-col justify-center w-[100vw] mx-0 px-4 py-0 text-gray-800">
      <div className="border-solid border-[0.5px] rounded-sm border-gray-800 my-2 pb-4 bg-white">
        <header className="flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-50">
          <div className="absolute left-6 md:left-16 lg:left-16 top-3 z-98 hidden md:inline-block lg:inline-block">
            <Image
              className="opacity-70 w-[60px] h-[60px] md:w-[70px] md:h-[70px] lg:w-[80px] lg:h-[80px] drop-shadow-lg transition-transform duration-300 hover:scale-105"
              width={100}
              height={100}
              src="/favicon.png"
              alt="Logo"
            />
          </div>
          {/*  */}
          <Image
            className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] drop-shadow-lg opacity-90 mb-2 block md:hidden lg:hidden"
            width={100}
            height={100}
            src="/favicon.png"
            alt="Logo"
          />
          <h1 className="text-3xl font-bold px-4 text-center md:ml-6">
            Terms & Conditions
          </h1>
        </header>

        <div className="mx-auto py-4 px-4 md:px-16 flex flex-col md:flex-row gap-10 bg-white h-full min-h-[84vh]">
          {/* Table of Contents */}
          <div className="w-full md:w-1/4">
            <div className="border border-gray-300 rounded p-4 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#intro" className="text-blue-600 hover:underline">
                    Introduction
                  </a>
                </li>
                <li>
                  <a href="#use" className="text-blue-600 hover:underline">
                    1. Use of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#messaging"
                    className="text-blue-600 hover:underline"
                  >
                    2. Messaging
                  </a>
                </li>
                <li>
                  <a
                    href="#liability"
                    className="text-blue-600 hover:underline"
                  >
                    3. Liability
                  </a>
                </li>
                <li>
                  <a
                    href="#modifications"
                    className="text-blue-600 hover:underline"
                  >
                    4. Modifications
                  </a>
                </li>
                <li>
                  <a
                    href="#termination"
                    className="text-blue-600 hover:underline"
                  >
                    5. Termination
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-blue-600 hover:underline">
                    6. Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Terms Content */}
          <div className="w-full md:w-3/4">
            <p id="intro" className="mb-4 scroll-mt-60">
              These Terms and Conditions (&quot;Terms&quot;) govern your use of
              our valet parking mobile app and related services
              (&quot;Service&quot;). By accessing or using our Service, you
              agree to these Terms. Please read them carefully.
            </p>

            <h2
              id="use"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-60"
            >
              1. Use of Service
            </h2>
            <p className="mb-4">
              You must be at least 18 years old to use our valet service. By
              using the app, you agree to provide accurate and up-to-date
              information. Our app is designed to facilitate smooth vehicle
              drop-off and retrieval and to communicate with you regarding the
              status of your vehicle. You agree not to misuse the app or disrupt
              the service in any way.
            </p>

            <h2
              id="messaging"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-60"
            >
              2. Messaging
            </h2>
            <p className="mb-4">
              By using the app, you consent to receive automated text messages
              or notifications regarding the status of your vehicle. These
              messages may include updates when your car is received, being
              parked, or ready for pickup. Message and data rates may apply
              depending on your carrier.
            </p>

            <h2
              id="liability"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-60"
            >
              3. Liability
            </h2>
            <p className="mb-4">
              While we strive to provide a secure and professional valet
              experience, we are not liable for any damage, loss, or theft
              occurring to vehicles unless caused by gross negligence or
              misconduct by our staff. We encourage you not to leave personal
              belongings inside your vehicle when using the valet service.
            </p>

            <h2
              id="modifications"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-60"
            >
              4. Modifications
            </h2>
            <p className="mb-4">
              We reserve the right to update or modify these Terms at any time
              without prior notice. Continued use of the Service after changes
              means you accept the revised terms.
            </p>

            <h2
              id="termination"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-60"
            >
              5. Termination
            </h2>
            <p className="mb-4">
              We may suspend or terminate your access to the Service if you
              violate these Terms or engage in any harmful conduct.
            </p>

            <h2
              id="contact"
              className="text-xl font-semibold mt-6 mb-2 scroll-mt-60"
            >
              6. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms or our{" "}
              <a
                className="text-blue-600 underline"
                href="privacy-policy"
                target="_blank"
              >
                Privacy Policy
              </a>
              , please contact our support team at{" "}
              <a
                href="mailto:support@example.com"
                className="text-blue-600 underline"
              >
                support@example.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
