"use client";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import FormInput from "./elements/FormInput";
import { FaMoneyBillWave, FaCreditCard } from "react-icons/fa";
import { MdPayment, MdOutlineReceiptLong, MdPassword } from "react-icons/md";
import { RiSecurePaymentFill } from "react-icons/ri";
import { MdCardGiftcard } from "react-icons/md";
import { TaxBreakdown } from "../types";
import { useProperty } from "../context/PropertyContext";

interface TransactionFormProps {
  form: TransactionForm;
  setForm: React.Dispatch<
    React.SetStateAction<{
      amount: number;
      paymentMethod: string;
      referenceNumber: string;
      notes?: string | undefined;
    }>
  >;
  ticketId?: string;
  missingFields?: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  latitude?: number;
  longitude?: number;
  locationMode?: "live" | "manual";
  propertyId?: string | null;
}

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string | undefined;
  pin?: string;
}

interface TransactionType {
  id: string;
  name: string;
  value: number;
  taxable?: boolean;
  stateTaxRate?: number;
  cityTaxRate?: number;
}

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildTaxBreakdown(type: TransactionType): TaxBreakdown | null {
  if (!type.taxable) return null;
  const base = Number(type.value) || 0;
  const sRate = type.stateTaxRate ?? 0;
  const cRate = type.cityTaxRate ?? 0;
  const stateTax = roundToTwo(base * (sRate / 100));
  const cityTax = roundToTwo(base * (cRate / 100));
  const total = roundToTwo(base + stateTax + cityTax);
  return { base, stateTax, stateTaxRate: sRate, cityTax, cityTaxRate: cRate, total };
}

interface PaymentStatusData {
  success: boolean;
  requestId: number;
  status: string;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  message: string;
  payment?: {
    authorization?: string;
    receipt?: string;
    amount?: number;
  };
}

/**
 * Subset of the Evertec get-status response used locally.
 * approval_code is the ONLY authoritative status indicator:
 *   "00" → approved | "ZY" → declined/cancelled | "ST" → still processing
 */
interface ECRPaymentData {
  /** "00" = approved | "ZY" = not approved | "ST" = processing */
  approval_code?: string;
  response_message?: string;
  /** Terminal field: VC=Visa, MC=MasterCard, AT=ATH Debit, AX=Amex, DC=Discover, AM=ATH Móvil, etc. */
  special_account?: string;
  /** Terminal field: last 4 digits of PAN or phone number */
  pan_card_number?: string;
  amounts?: { total?: string };
  receipt?: string;
  trx_id?: string;
  reference?: string;
  /** "C"=Credit | "D"=Debit | "I"=IVU Cash | "E"=EBT | "A"=ATH Movil */
  transaction_type_indicator?: string;
  /** "MANUAL" | "MSR" | "CTLS" | "CHIP" */
  entry_type?: string;
}

export default function TransactionForm({
  form,
  setForm,
  ticketId,
  missingFields = [],
  setOpen,
  latitude,
  longitude,
  locationMode,
  propertyId,
  setReloadPageData,
}: TransactionFormProps) {
  const { accountUser, userRole, latitude: ctxLatitude, longitude: ctxLongitude } = useProperty();
  const isAdmin = userRole?.toLowerCase() === "admin" || userRole === "1";

  const [loader, setLoader] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [courtesyLoading, setCourtesyLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(
    [],
  );
  const [placeToPayLoading, setPlaceToPayLoading] = useState(false);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [ecrLoading, setEcrLoading] = useState(false);
  const [athMovilLoading, setAthMovilLoading] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateTicketNumber();
    fetchTransactionTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch transaction types from API
  const fetchTransactionTypes = async () => {
    try {
      const res = await fetch("/api/valetTransaction/types/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId }),
      });
      const data = await res.json();
      if (data?.result?.status === "200") {
        setTransactionTypes(data?.result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching transaction types:", error);
    }
  };

  // Generate a ticket number
  const generateTicketNumber = () => {
    const alphanumericSix = uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase();
    setForm((prev) => ({ ...prev, referenceNumber: alphanumericSix }));
  };

  // Update form values on change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Automatically update amount when paymentMethod changes
    if (name === "paymentMethod") {
      const selected = transactionTypes?.find((t) => t.name === value);
      setForm((prev) => ({ ...prev, value: selected?.value || 0 }));
    }
  };

  // Submit Transaction
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form?.paymentMethod || !form?.referenceNumber) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoader(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: userLat, longitude: userLng } = position.coords;

      const sendForm = {
        latitude: locationMode === "manual" ? latitude : userLat,
        longitude: locationMode === "manual" ? longitude : userLng,
        propertyId,
        ticketId: ticketId,
        pin: form?.pin || "",
        amount: totalAmount,
        paymentMethod: form?.paymentMethod,
        referenceNumber: form?.referenceNumber,
        notes: form?.notes,
      };

      try {
        const res = await fetch("/api/valetTransaction/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });
        const result = await res.json();

        if (result?.result?.status == "200") {
          setOpen(false);
          setReloadPageData(true);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Transaction successful!",
            showConfirmButton: false,
            timer: 1500,
          });
          setForm({
            amount: 0,
            paymentMethod: "",
            referenceNumber: "",
            notes: "",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Submission Failed",
            text:
              result?.result?.message ||
              "Something went wrong. Please try again.",
          });
          setLoader(false);
          return;
        }
      } catch (error) {
        console.error("Error submitting transaction:", error);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "Something went wrong. Please try again.",
        });
      } finally {
        setLoader(false);
      }
    });
  };

  // Get selected transaction type details
  const selectedTransactionType = transactionTypes?.find(
    (t) => t?.name === form?.paymentMethod,
  );

  // Base price (stored value)
  const price = selectedTransactionType?.value;

  // Tax breakdown (null when rate is not taxable)
  const taxBreakdown: TaxBreakdown | null = selectedTransactionType
    ? buildTaxBreakdown(selectedTransactionType)
    : null;

  // Total to charge — includes taxes when applicable
  const totalAmount = taxBreakdown ? taxBreakdown.total : (Number(price) || 0);

  // Handle Courtesy (admin only — waives payment, records reason/who/when)
  const handleCourtesy = async () => {
    if (!form?.pin || form.pin.length !== 4) {
      Swal.fire({ icon: "warning", title: "PIN Required", text: "Please enter your 4-digit PIN before applying a courtesy." });
      return;
    }

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Give Courtesy",
      html: `
        <p class="text-sm text-gray-600 mb-3">Ticket <strong>#${form?.referenceNumber}</strong> will be waived. Please provide a reason.</p>
        <textarea id="courtesy-reason" class="swal2-textarea w-full" placeholder="Enter reason for courtesy..." rows="3" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:14px;"></textarea>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Apply Courtesy",
      confirmButtonColor: "#2563eb",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const el = document.getElementById("courtesy-reason") as HTMLTextAreaElement;
        const val = el?.value?.trim();
        if (!val) {
          Swal.showValidationMessage("A reason is required to apply a courtesy.");
          return false;
        }
        return val;
      },
    });

    if (!isConfirmed || !reason) return;

    setCourtesyLoading(true);

    try {
      const resolvedLat = locationMode === "manual" ? latitude : ctxLatitude;
      const resolvedLng = locationMode === "manual" ? longitude : ctxLongitude;

      const res = await fetch("/api/valetTransaction/courtesy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          reason,
          givenBy: accountUser || "Unknown",
          givenAt: new Date().toISOString(),
          propertyId,
          pin: form?.pin,
          latitude: resolvedLat ?? 0,
          longitude: resolvedLng ?? 0,
          locationMode,
        }),
      });

      const result = await res.json();

      if (result?.result?.status === "200") {
        setOpen(false);
        setReloadPageData(true);
        Swal.fire({
          icon: "success",
          title: "Courtesy Applied",
          html: `
            <p>The valet fee has been waived.</p>
            <p class="mt-2 text-sm text-gray-500">Reason: <em>${reason}</em></p>
            <p class="text-sm text-gray-500">Given by: <strong>${accountUser || "Unknown"}</strong></p>
          `,
          showConfirmButton: false,
          timer: 3000,
        });
        setForm({ amount: 0, paymentMethod: "", referenceNumber: "", notes: "" });
      } else {
        Swal.fire({
          icon: "error",
          title: "Courtesy Failed",
          text: result?.result?.message || "Could not apply courtesy. Please try again.",
        });
      }
    } catch (error) {
      console.error("Courtesy error:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong." });
    } finally {
      setCourtesyLoading(false);
    }
  };

  // Handle PlaceToPay payment
  const handlePlaceToPayPayment = async () => {
    if (!form?.paymentMethod || !selectedTransactionType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a transaction type first.",
      });
      return;
    }

    if (!ticketId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ticket ID is missing. Please try again.",
      });
      return;
    }

    setPlaceToPayLoading(true);

    try {
      // Fetch ticket details to get patron information
      const ticketRes = await fetch("/api/getTicketDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId }),
      });

      if (!ticketRes.ok) {
        throw new Error("Failed to fetch ticket details");
      }

      const ticketData = await ticketRes.json();
      console.log("Ticket data response:", ticketData);

      // The patron data is at ticketData?.data?.patron, not ticketData?.result?.data?.patron
      const patron = ticketData?.data?.patron;
      console.log("Patron data:", patron);

      if (!patron) {
        Swal.fire({
          icon: "error",
          title: "Missing Patron Information",
          text: "Unable to retrieve customer information. Please try again.",
        });
        setPlaceToPayLoading(false);
        return;
      }

      // Use phone number as fallback email if email is missing
      const patronEmail =
        patron.email || `${patron.phoneNumber}@temp.valet.com`;

      if (!patronEmail && !patron.phoneNumber) {
        Swal.fire({
          icon: "error",
          title: "Missing Contact Information",
          text: "Customer email or phone number is required for online payment.",
        });
        setPlaceToPayLoading(false);
        return;
      }

      // Create checkout session
      const checkoutRes = await fetch("/api/payments/placetopay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticketId,
          patronName: patron.firstName || "Guest",
          patronSurname: patron.lastName || "",
          patronEmail: patronEmail,
          patronPhone: patron.phoneNumber,
          amount: totalAmount,
          transactionTypeId: selectedTransactionType.id,
          transactionDescription: `${form.paymentMethod} - Valet Parking Service`,
          propertyReference: propertyId || "VP",
        }),
      });

      console.log("Checkout request sent with data:", {
        ticketId: ticketId,
        patronName: patron.firstName || "Guest",
        patronSurname: patron.lastName || "",
        patronEmail: patronEmail,
        amount: totalAmount,
      });

      if (!checkoutRes.ok) {
        const errorData = await checkoutRes.json();
        console.error("Checkout error response:", errorData);
        throw new Error(
          errorData.message || "Failed to create payment session",
        );
      }

      const checkoutData = await checkoutRes.json();
      console.log("Checkout success response:", checkoutData);

      if (!checkoutData.success || !checkoutData.processUrl) {
        console.error("Invalid checkout data:", checkoutData);
        throw new Error(
          checkoutData.message || "Invalid payment session response",
        );
      }

      // Open payment page in new tab
      const newWindow = window.open(checkoutData.processUrl, "_blank");
      setPaymentWindow(newWindow);

      // Show processing message and start automatic verification
      Swal.fire({
        icon: "info",
        title: "Processing Payment",
        html: `
          <p>A new tab has been opened for payment processing.</p>
          <p class="mt-2 text-sm">Please complete the payment in the new window.</p>
          <p class="mt-2 text-sm font-semibold">Request ID: ${checkoutData.requestId}</p>
          <p class="mt-3 text-xs text-gray-500">Checking payment status automatically...</p>
        `,
        showCancelButton: true,
        cancelButtonText: "Cancel Payment",
        allowOutsideClick: false,
        didOpen: () => {
          // Start automatic polling when modal opens
          pollPlaceToPayStatus(checkoutData.requestId, newWindow);
        },
      }).then((result) => {
        if (
          result.isDismissed &&
          result.dismiss === Swal.DismissReason.cancel
        ) {
          // User clicked cancel - stop polling and cleanup
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
          setPlaceToPayLoading(false);
          if (newWindow && !newWindow.closed) {
            newWindow.close();
          }
        }
      });
    } catch (error) {
      console.error("PlaceToPay payment error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      Swal.fire({
        icon: "error",
        title: "Payment Error",
        html: `
          <p>${errorMessage}</p>
          <p class="mt-2 text-xs text-gray-500">Check console for more details</p>
        `,
      });
      setPlaceToPayLoading(false);
    }
  };

  // Poll PlaceToPay payment status automatically
  const pollPlaceToPayStatus = async (
    requestId: number,
    paymentWin: Window | null,
  ) => {
    const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds max
    let attempts = 0;

    const intervalId = setInterval(async () => {
      attempts++;
      console.log(
        `PlaceToPay: Checking payment status - attempt ${attempts}/${maxAttempts}`,
      );

      try {
        const statusRes = await fetch(
          `/api/payments/placetopay/session/${requestId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!statusRes.ok) {
          throw new Error("Failed to verify payment status");
        }

        const statusData = await statusRes.json();
        console.log("PlaceToPay: Payment status response:", statusData);

        if (statusData.isApproved) {
          // Payment approved - stop polling and complete transaction
          clearInterval(intervalId);
          setPollingIntervalId(null);
          console.log(
            "PlaceToPay: Payment APPROVED - proceeding to complete transaction",
          );
          Swal.close();
          await completeTransaction(statusData);

          // Close payment window if still open
          if (paymentWin && !paymentWin.closed) {
            paymentWin.close();
          }
        } else if (statusData.isRejected) {
          // Payment rejected - stop polling and show error
          clearInterval(intervalId);
          setPollingIntervalId(null);
          console.log("PlaceToPay: Payment REJECTED");
          Swal.close();

          // Close payment window if still open
          if (paymentWin && !paymentWin.closed) {
            paymentWin.close();
          }

          Swal.fire({
            icon: "error",
            title: "Payment Rejected",
            text:
              statusData.message ||
              "The payment was rejected. Please try again.",
          });
          setPlaceToPayLoading(false);
        } else if (statusData.isPending) {
          console.log(
            "PlaceToPay: Payment still PENDING - continuing to poll...",
          );
          // Continue polling
        }

        // Check for timeout
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollingIntervalId(null);
          console.log("PlaceToPay: Payment verification TIMEOUT");
          Swal.close();

          Swal.fire({
            icon: "warning",
            title: "Verification Timeout",
            text: "Payment verification timed out. Please check your payment status manually.",
            showCancelButton: true,
            confirmButtonText: "Check Status Now",
            cancelButtonText: "Close",
          }).then((result) => {
            if (result.isConfirmed) {
              verifyPaymentStatus(requestId);
            } else {
              setPlaceToPayLoading(false);
              if (paymentWin && !paymentWin.closed) {
                paymentWin.close();
              }
            }
          });
        }
      } catch (error) {
        clearInterval(intervalId);
        setPollingIntervalId(null);
        console.error("PlaceToPay: Payment verification error:", error);
        Swal.close();

        Swal.fire({
          icon: "error",
          title: "Verification Error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to verify payment status.",
          showCancelButton: true,
          confirmButtonText: "Retry",
          cancelButtonText: "Close",
        }).then((result) => {
          if (result.isConfirmed) {
            verifyPaymentStatus(requestId);
          } else {
            setPlaceToPayLoading(false);
            if (paymentWin && !paymentWin.closed) {
              paymentWin.close();
            }
          }
        });
      }
    }, 3000); // Poll every 3 seconds as requested

    // Store interval ID for cleanup
    setPollingIntervalId(intervalId);
  };

  // Verify payment status (manual fallback)
  const verifyPaymentStatus = async (requestId: number) => {
    try {
      console.log("PlaceToPay: Manual verification for request ID:", requestId);

      const statusRes = await fetch(
        `/api/payments/placetopay/session/${requestId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!statusRes.ok) {
        const errorText = await statusRes.text();
        console.error("PlaceToPay: Status check failed:", errorText);
        throw new Error("Failed to verify payment status");
      }

      const statusData = await statusRes.json();
      console.log("PlaceToPay: Manual verification response:", statusData);

      if (!statusData.success) {
        throw new Error(statusData.message || "Invalid status response");
      }

      if (statusData.isApproved) {
        // Payment approved - complete transaction
        await completeTransaction(statusData);
      } else if (statusData.isPending) {
        Swal.fire({
          icon: "warning",
          title: "Payment Still Pending",
          text: "Payment is still being processed. Would you like to check again?",
          showCancelButton: true,
          confirmButtonText: "Check Again",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            setTimeout(() => verifyPaymentStatus(requestId), 3000);
          } else {
            setPlaceToPayLoading(false);
          }
        });
      } else if (statusData.isRejected) {
        Swal.fire({
          icon: "error",
          title: "Payment Rejected",
          text:
            statusData.message || "The payment was rejected. Please try again.",
        });
        setPlaceToPayLoading(false);
      }
    } catch (error) {
      console.error("PlaceToPay: Manual verification error:", error);
      Swal.fire({
        icon: "error",
        title: "Verification Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to verify payment status.",
      });
      setPlaceToPayLoading(false);
    }
  };

  // Complete transaction after successful payment
  const completeTransaction = async (paymentData: PaymentStatusData) => {
    console.log("Completing transaction with payment data:", paymentData);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: userLat, longitude: userLng } = position.coords;

      const sendForm = {
        latitude: locationMode === "manual" ? latitude : userLat,
        longitude: locationMode === "manual" ? longitude : userLng,
        propertyId,
        ticketId: ticketId,
        pin: form?.pin || "",
        amount: totalAmount,
        paymentMethod: `PlaceToPay - ${form?.paymentMethod}`,
        referenceNumber:
          paymentData.payment?.authorization || form?.referenceNumber,
        notes: `${form?.notes || ""}\nPlaceToPay Receipt: ${paymentData.payment?.receipt || "N/A"}`,
      };

      console.log("Submitting transaction:", sendForm);

      try {
        const res = await fetch("/api/valetTransaction/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });
        const result = await res.json();
        console.log("Transaction result:", result);

        if (result?.result?.status == "200") {
          // Close payment window if still open
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }

          setOpen(false);
          setReloadPageData(true);
          Swal.fire({
            icon: "success",
            title: "Payment Successful",
            html: `
              <p>Transaction completed successfully!</p>
              <p class="mt-2 text-sm">Authorization: ${paymentData.payment?.authorization || "N/A"}</p>
              <p class="text-sm">Receipt: ${paymentData.payment?.receipt || "N/A"}</p>
            `,
            showConfirmButton: false,
            timer: 3000,
          });
          setForm({
            amount: 0,
            paymentMethod: "",
            referenceNumber: "",
            notes: "",
          });
        } else {
          throw new Error(
            result?.result?.message || "Transaction recording failed",
          );
        }
      } catch (error) {
        console.error("Error completing transaction:", error);
        Swal.fire({
          icon: "error",
          title: "Transaction Error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to record transaction. Please contact support.",
        });
      } finally {
        setPlaceToPayLoading(false);
      }
    });
  };

  // Handle ECR Terminal Payment
  const handleECRPayment = async () => {
    // Prevent duplicate calls
    if (ecrLoading) {
      console.log("ECR: Payment already in progress, ignoring duplicate call");
      return;
    }

    if (!form?.paymentMethod || !selectedTransactionType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a transaction type first.",
      });
      return;
    }

    if (!ticketId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ticket ID is missing. Please try again.",
      });
      return;
    }

    setEcrLoading(true);

    // Initialize reference counter for new session
    // Use large random reference numbers to avoid conflicts with previous failed sessions
    // Range: 10000-99999 to ensure unique references even if previous session wasn't closed
    const startRef = Math.floor(Math.random() * 89999) + 10000;
    let currentRef = startRef;
    let sessionId = "";

    try {
      // Step 1: Establish terminal session
      console.log(
        "ECR: Logon - Starting new session with base reference:",
        startRef,
      );
      console.log(
        "ECR: Logon - reference:",
        currentRef,
        "last_reference:",
        currentRef - 1,
      );

      const logonRes = await fetch("/api/payments/ecr/session/logon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: currentRef.toString(),
          last_reference: (currentRef - 1).toString(),
        }),
      });

      if (!logonRes.ok) {
        throw new Error("Failed to connect to payment terminal");
      }

      const logonData = await logonRes.json();
      console.log("ECR: Logon response:", logonData);

      if (!logonData.success || !logonData.session_id) {
        throw new Error("Invalid terminal session response");
      }

      sessionId = logonData.session_id;
      console.log("ECR: New session established:", sessionId);

      // Step 2: Initiate sale on terminal (increment from logon reference)
      currentRef = startRef + 1;
      console.log("ECR: Start Sale - Incrementing reference");
      console.log(
        "ECR: Start Sale - reference:",
        currentRef,
        "last_reference:",
        currentRef - 1,
      );
      console.log("ECR: Start Sale - session_id:", sessionId);

      Swal.fire({
        title: "Payment Terminal",
        html:
          "<p>Please insert, swipe, or tap your card at the terminal.</p><p class='text-sm mt-2'>Amount: $" +
          totalAmount.toFixed(2) +
          "</p>",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      let forceDuplicate = false;
      let saleData: { trx_id?: string; message?: string } | null = null;

      // Sale attempt loop — may retry once with force_duplicate
      for (let attempt = 0; attempt < 2; attempt++) {
        const saleRes = await fetch("/api/payments/ecr/sales/start-sale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            reference: currentRef.toString(),
            last_reference: (currentRef - 1).toString(),
            amount: totalAmount,
            ...(forceDuplicate ? { force_duplicate: "yes" } : {}),
          }),
        });

        if (!saleRes.ok) {
          const errorData = await saleRes
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error("ECR Start Sale failed:", errorData);

          // Handle DUPLICATE TRANSACTION (HTTP 409)
          if (saleRes.status === 409 && errorData.error === "DUPLICATE_TRANSACTION" && attempt === 0) {
            console.warn("ECR: Duplicate detected — showing decision modal");
            Swal.close();

            const lastSuccessfulRef = (startRef).toString();
            const decision = await showDuplicateDecisionModal(
              sessionId,
              currentRef.toString(),
              lastSuccessfulRef,
            );

            if (decision.force) {
              // Operator chose to force — increment ref past journal + retry
              forceDuplicate = true;
              currentRef = decision.journalRef + 1;
              console.log("ECR: Retrying with force_duplicate, new ref:", currentRef);

              Swal.fire({
                title: "Payment Terminal",
                html:
                  "<p>Retrying payment (force duplicate)...</p><p class='text-sm mt-2'>Amount: $" +
                  totalAmount.toFixed(2) +
                  "</p>",
                icon: "info",
                showConfirmButton: false,
                allowOutsideClick: false,
              });
              continue; // retry the sale
            } else {
              // Operator cancelled
              await ecrLogoff(sessionId, decision.journalRef);
              setEcrLoading(false);
              return;
            }
          }

          // If reference already in use, try to close the session and inform user
          if (errorData.details?.error?.includes("ALREADY IN USE")) {
            console.error("ECR: Reference conflict - attempting session cleanup");
            try {
              await fetch("/api/payments/ecr/session/logoff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  session_id: sessionId,
                  reference: (currentRef + 1).toString(),
                  last_reference: currentRef.toString(),
                }),
              });
            } catch (e) {
              console.error("ECR: Cleanup logoff failed:", e);
            }
            throw new Error("Terminal session conflict. Please try again.");
          }

          throw new Error(
            errorData.message || "Failed to initiate terminal payment",
          );
        }

        saleData = await saleRes.json();
        console.log("ECR: Sale response:", saleData);
        break; // Success — exit the retry loop
      }

      // If we have a trx_id, the sale was initiated (proceed with polling)
      if (!saleData?.trx_id) {
        throw new Error(
          saleData?.message || "Invalid sale response - no transaction ID",
        );
      }

      console.log(
        "ECR: Sale initiated successfully - trx_id:",
        saleData.trx_id,
      );
      console.log("ECR: Current reference after start-sale:", currentRef);

      // Step 3: Poll for status (does NOT use reference numbers per ECR documentation)
      await pollECRStatus(sessionId, saleData.trx_id, currentRef);
    } catch (error) {
      console.error("ECR payment error:", error);
      Swal.fire({
        icon: "error",
        title: "Payment Terminal Error",
        text:
          error instanceof Error
            ? error.message
            : "Terminal communication failed",
      });

      // Cleanup: end terminal session if one was established
      if (sessionId && currentRef > 0) {
        await ecrLogoff(sessionId, currentRef);
      } else {
        console.log("ECR: Skipping logoff - session never fully established");
      }

      setEcrLoading(false);
    }
  };

  // Card type code → readable name mapping
  const CARD_TYPE_MAP: Record<string, string> = {
    VC: "Visa", MC: "MasterCard", AT: "ATH Debit", AX: "Amex",
    DC: "Discover", IC: "Cash", UN: "UnionPay", EB: "EBT Food",
    EC: "EBT Cash", AM: "ATH Móvil", BA: "Health Card", FN: "Fondo",
  };

  /**
   * Query journal for a specific transaction reference to check if it was approved.
   * Used during duplicate detection to show the operator what happened with the
   * previous (potentially duplicate) transaction.
   */
  const queryJournalForReference = async (
    sessionId: string,
    reference: string,
    lastReference: string,
    targetReference: string,
  ): Promise<{ found: boolean; transaction?: Record<string, unknown>; error?: string }> => {
    try {
      // Journal needs its own unique reference; last_reference = last successful ref
      const journalRef = (parseInt(reference, 10) + 1).toString();
      const res = await fetch("/api/payments/ecr/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          reference: journalRef,
          last_reference: lastReference,
          target_reference: targetReference,
        }),
      });

      if (!res.ok) {
        return { found: false, error: "Journal query failed" };
      }

      const data = await res.json();
      if (data.approval_code !== "00") {
        return { found: false, error: data.response_message || "Journal rejected" };
      }

      return { found: true, transaction: data.reference_value };
    } catch (e) {
      console.error("Journal query error:", e);
      return { found: false, error: "Journal request failed" };
    }
  };

  /**
   * Shows a modal with the duplicate transaction details from journal and lets
   * the operator decide whether to force the duplicate or cancel.
   * Returns true if the operator chose to force, false if cancelled.
   */
  const showDuplicateDecisionModal = async (
    sessionId: string,
    saleReference: string,
    lastSuccessfulRef: string,
  ): Promise<{ force: boolean; journalRef: number }> => {
    // Query journal to check what happened with previous transactions
    Swal.fire({
      title: "Checking Previous Transactions...",
      html: "<p>Querying terminal journal to verify the previous transaction status.</p>",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const journalResult = await queryJournalForReference(
      sessionId,
      saleReference,
      lastSuccessfulRef,
      "all",
    );

    // The journal query used saleReference+1 as its own reference
    const journalRefUsed = parseInt(saleReference, 10) + 1;

    // Build the journal info HTML for the modal
    let journalHtml = "";
    if (journalResult.found && journalResult.transaction) {
      // Parse transactions from all hosts
      const txnDetails: string[] = [];
      const refValue = journalResult.transaction as Record<string, unknown>;

      // Check if it's grouped by host (ATH1, ATH2...) or a single transaction
      const hosts = Object.keys(refValue);
      for (const host of hosts) {
        const hostData = refValue[host] as Record<string, unknown> | undefined;
        if (!hostData) continue;

        const transactions = (hostData as { trans?: Array<Record<string, unknown>> }).trans;
        if (Array.isArray(transactions)) {
          for (const txn of transactions) {
            const status = txn.approval_code === "00" ? "APPROVED" : "DECLINED";
            const statusColor = txn.approval_code === "00" ? "text-green-600" : "text-red-600";
            const cardName = CARD_TYPE_MAP[txn.special_account as string] || txn.special_account || "N/A";
            txnDetails.push(`
              <div class="border rounded p-2 mb-2 text-left text-sm">
                <div class="flex justify-between">
                  <span class="font-semibold">${txn.transaction_type || "Transaction"}</span>
                  <span class="font-bold ${statusColor}">${status}</span>
                </div>
                <div class="text-gray-600 mt-1">
                  Ref: ${txn.reference || "N/A"} | Amount: $${(txn.amounts as Record<string, string>)?.total || "N/A"}
                </div>
                <div class="text-gray-600">
                  ${cardName} ending in ${txn.pan_card_number || "N/A"} | ${txn.transaction_time || ""}
                </div>
              </div>
            `);
          }
        }
      }

      if (txnDetails.length > 0) {
        journalHtml = `
          <div class="mt-3 max-h-48 overflow-y-auto">
            <p class="text-sm font-semibold mb-2 text-left">Batch Transactions:</p>
            ${txnDetails.join("")}
          </div>
        `;
      } else {
        journalHtml = `<p class="text-sm text-gray-500 mt-2">No transactions found in current batch.</p>`;
      }
    } else {
      journalHtml = `<p class="text-sm text-yellow-600 mt-2">Could not retrieve journal: ${journalResult.error || "Unknown error"}</p>`;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Duplicate Transaction Detected",
      html: `
        <p class="text-sm">The terminal detected this transaction may be a duplicate of a recent one.</p>
        <p class="text-sm mt-2 text-red-600 font-semibold">
          If a previous transaction was APPROVED, forcing this duplicate will charge the customer again.
        </p>
        ${journalHtml}
        <p class="text-xs text-gray-400 mt-3">Review the transactions above before deciding.</p>
      `,
      showCancelButton: true,
      confirmButtonText: "Force Duplicate & Retry",
      cancelButtonText: "Cancel Payment",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      width: 520,
    });

    return { force: result.isConfirmed, journalRef: journalRefUsed };
  };

  // Logoff helper — centralizes the repeated logoff fetch
  const ecrLogoff = async (sessionId: string, lastRef: number) => {
    try {
      await fetch("/api/payments/ecr/session/logoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          reference: (lastRef + 1).toString(),
          last_reference: lastRef.toString(),
        }),
      });
    } catch (e) {
      console.error("ECR: Logoff failed:", e);
    }
  };

  // Handle ATH Móvil Payment (via Evertec middleware)
  const handleATHMovilPayment = async () => {
    if (athMovilLoading) {
      console.log("ATH Móvil: Payment already in progress, ignoring duplicate call");
      return;
    }

    if (!form?.paymentMethod || !selectedTransactionType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a transaction type first.",
      });
      return;
    }

    if (!ticketId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ticket ID is missing. Please try again.",
      });
      return;
    }

    setAthMovilLoading(true);

    const startRef = Math.floor(Math.random() * 89999) + 10000;
    let currentRef = startRef;
    let sessionId = "";

    try {
      // Step 1: Logon — reuse the same ECR session endpoint
      console.log("ATH Móvil: Logon - Starting new session, base reference:", startRef);

      const logonRes = await fetch("/api/payments/ecr/session/logon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: currentRef.toString(),
          last_reference: (currentRef - 1).toString(),
        }),
      });

      if (!logonRes.ok) {
        throw new Error("Failed to connect to payment terminal");
      }

      const logonData = await logonRes.json();
      console.log("ATH Móvil: Logon response:", logonData);

      if (!logonData.success || !logonData.session_id) {
        throw new Error("Invalid terminal session response");
      }

      sessionId = logonData.session_id;
      console.log("ATH Móvil: Session established:", sessionId);

      // Step 2: Initiate ATH Móvil sale
      currentRef = startRef + 1;

      let forceDuplicate = false;
      let saleData: { trx_id?: string; message?: string } | null = null;

      // Sale attempt loop — may retry once with force_duplicate
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt === 0 || forceDuplicate) {
          Swal.fire({
            title: "ATH Móvil Payment",
            html:
              "<p>Waiting for the customer to complete payment via ATH Móvil.</p><p class='text-sm mt-2'>Amount: $" +
              totalAmount.toFixed(2) +
              (forceDuplicate ? "</p><p class='text-xs text-yellow-600 mt-1'>Force duplicate enabled</p>" : "</p>"),
            icon: "info",
            showConfirmButton: false,
            allowOutsideClick: false,
          });
        }

        const saleRes = await fetch("/api/payments/evertec/sales/start-ath-movil-sale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            reference: currentRef.toString(),
            last_reference: (currentRef - 1).toString(),
            amount: totalAmount,
            ...(forceDuplicate ? { force_duplicate: "yes" } : {}),
          }),
        });

        if (!saleRes.ok) {
          const errorData = await saleRes
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error("ATH Móvil Sale failed:", errorData);

          // Handle DUPLICATE TRANSACTION (HTTP 409)
          if (saleRes.status === 409 && errorData.error === "DUPLICATE_TRANSACTION" && attempt === 0) {
            console.warn("ATH Móvil: Duplicate detected — showing decision modal");
            Swal.close();

            const lastSuccessfulRef = (startRef).toString();
            const decision = await showDuplicateDecisionModal(
              sessionId,
              currentRef.toString(),
              lastSuccessfulRef,
            );

            if (decision.force) {
              forceDuplicate = true;
              currentRef = decision.journalRef + 1;
              console.log("ATH Móvil: Retrying with force_duplicate, new ref:", currentRef);
              continue;
            } else {
              await ecrLogoff(sessionId, decision.journalRef);
              setAthMovilLoading(false);
              return;
            }
          }

          if (errorData.details?.error?.includes("ALREADY IN USE")) {
            try {
              await fetch("/api/payments/ecr/session/logoff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  session_id: sessionId,
                  reference: (currentRef + 1).toString(),
                  last_reference: currentRef.toString(),
                }),
              });
            } catch (e) {
              console.error("ATH Móvil: Cleanup logoff failed:", e);
            }
            throw new Error("Terminal session conflict. Please try again.");
          }

          throw new Error(errorData.message || "Failed to initiate ATH Móvil payment");
        }

        saleData = await saleRes.json();
        console.log("ATH Móvil: Sale response:", saleData);
        break; // Success — exit the retry loop
      }

      if (!saleData?.trx_id) {
        throw new Error(saleData?.message || "Invalid sale response - no transaction ID");
      }

      console.log("ATH Móvil: Sale initiated - trx_id:", saleData.trx_id);

      // Step 3: Poll status — reuse the shared ECR polling, labelled as ATH Móvil
      await pollECRStatus(sessionId, saleData.trx_id, currentRef, "ATH Móvil", setAthMovilLoading);
    } catch (error) {
      console.error("ATH Móvil payment error:", error);
      Swal.fire({
        icon: "error",
        title: "ATH Móvil Payment Error",
        text:
          error instanceof Error
            ? error.message
            : "Payment communication failed",
      });

      if (sessionId && currentRef > 0) {
        await ecrLogoff(sessionId, currentRef);
      }

      setAthMovilLoading(false);
    }
  };

  // Resolve the terminal outcome from the get-status response.
  //
  // Per Evertec API documentation the ONLY field that determines outcome is:
  //   approval_code === "00"  → APPROVED  (transaction complete, card charged)
  //   approval_code === "ZY"  → DECLINED  (not approved: cancelled, declined, error, etc.)
  //   approval_code === "ST"  → PENDING   (still processing — keep polling)
  //
  // WARNING: Do NOT treat any non-empty approval_code as "approved".
  // "ZY" and "ST" are always present in every response and must be handled distinctly.
  const resolveECROutcome = (
    data: ECRPaymentData,
  ): "approved" | "declined" | "pending" => {
    const approvalCode = (data.approval_code || "").trim().toUpperCase();
    const responseMsg = (data.response_message || "").toUpperCase();

    // Primary check — approval_code is the authoritative status field
    if (approvalCode === "00") return "approved";
    if (approvalCode === "ZY") return "declined";
    if (approvalCode === "ST") return "pending";

    // Fallback for unexpected/missing approval_code: read response_message
    if (
      responseMsg === "APPROVED." ||
      responseMsg === "APPROVED" ||
      responseMsg === "APROBADO"
    )
      return "approved";

    if (
      responseMsg.includes("DECLIN") ||
      responseMsg.includes("CANCELLED") ||
      responseMsg.includes("CANCEL") ||
      responseMsg.includes("DENIED") ||
      responseMsg.includes("REJECT") ||
      responseMsg.includes("NOT APPROVED") ||
      responseMsg.includes("RECHAZADO")
    )
      return "declined";

    // Unknown state — treat as still pending
    return "pending";
  };

  /**
   * Format a timestamp for the status log (HH:MM:SS)
   */
  const formatLogTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
  };

  /**
   * Build the status log modal HTML.
   * The log container has id="ecr-status-log" so we can append entries during polling.
   */
  const showStatusLogModal = (methodLabel: string, amount: number) => {
    const instruction = methodLabel.includes("ATH")
      ? "Waiting for the customer to complete payment via ATH Móvil."
      : "Please insert, swipe, or tap your card at the terminal.";

    Swal.fire({
      title: `${methodLabel} — Processing`,
      html: `
        <p class="text-sm">${instruction}</p>
        <p class="text-sm mt-1 font-semibold">Amount: $${amount.toFixed(2)}</p>
        <div class="mt-3 text-left">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Transaction Status Log</p>
          <div id="ecr-status-log"
               class="bg-gray-50 border rounded p-2 max-h-44 overflow-y-auto text-xs font-mono"
               style="min-height: 80px;">
            <div class="text-gray-400">${formatLogTime()} — Waiting for terminal response...</div>
          </div>
          <p id="ecr-poll-counter" class="text-xs text-gray-400 mt-1 text-right">Poll: 0/60</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: 480,
    });
  };

  /**
   * Append an entry to the live status log inside the active Swal modal.
   */
  const appendStatusLog = (
    code: string,
    message: string,
    attempt: number,
    maxAttempts: number,
  ) => {
    const logEl = document.getElementById("ecr-status-log");
    const counterEl = document.getElementById("ecr-poll-counter");
    if (!logEl) return;

    // Color code based on approval_code
    let colorClass = "text-gray-600"; // default / ST
    let icon = "⏳";
    if (code === "00") { colorClass = "text-green-600 font-semibold"; icon = "✅"; }
    else if (code === "ZY") { colorClass = "text-red-600 font-semibold"; icon = "❌"; }
    else if (code === "ST") { icon = "🔄"; }

    const isDuplicate = message.toUpperCase().includes("DUPLICAT");
    if (isDuplicate) { colorClass = "text-orange-600 font-semibold"; icon = "⚠️"; }

    const entry = document.createElement("div");
    entry.className = `${colorClass} py-0.5 border-b border-gray-100 last:border-0`;
    entry.innerHTML = `${icon} ${formatLogTime()} — [${code || "??"}] ${message || "No message"}`;
    logEl.appendChild(entry);

    // Auto-scroll to bottom
    logEl.scrollTop = logEl.scrollHeight;

    // Update counter
    if (counterEl) {
      counterEl.textContent = `Poll: ${attempt}/${maxAttempts}`;
    }
  };

  // Poll ECR / ATH Móvil transaction status with live status log
  const pollECRStatus = async (
    sessionId: string,
    trxId: string,
    lastUsedRef: number,
    methodLabel: string = "ECR Terminal",
    setLoading: (v: boolean) => void = setEcrLoading,
  ) => {
    const maxAttempts = 60;
    let attempts = 0;

    // Show the status log modal
    showStatusLogModal(methodLabel, totalAmount);

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        console.log(`ECR: Get Status - attempt ${attempts}/${maxAttempts}`);

        const statusRes = await fetch(
          "/api/payments/ecr/transaction/get-status",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, trx_id: trxId }),
          },
        );

        if (!statusRes.ok) {
          appendStatusLog("ERR", "Status check failed", attempts, maxAttempts);
          throw new Error("Status check failed");
        }

        const statusData = await statusRes.json();
        console.log("ECR: Status response:", JSON.stringify(statusData, null, 2));

        const outcome = resolveECROutcome(statusData);
        const code = statusData.approval_code || "";
        const msg = statusData.response_message || "";

        // Append to live log
        appendStatusLog(code, msg, attempts, maxAttempts);

        console.log(
          `ECR: Outcome resolved → ${outcome}`,
          `| approval_code: "${code}"`,
          `| response_message: "${msg}"`,
        );

        // Check for duplicate signal during polling
        const isDuplicateDuringPoll = msg.toUpperCase().includes("DUPLICAT");
        if (isDuplicateDuringPoll) {
          console.warn("ECR: Duplicate signal detected during status polling:", msg);
        }

        if (outcome === "approved") {
          clearInterval(pollInterval);
          Swal.close();
          await completeECRTransaction(sessionId, lastUsedRef, statusData, methodLabel, setLoading);

        } else if (outcome === "declined") {
          clearInterval(pollInterval);

          // Build a summary of the status log for the decline modal
          const logEl = document.getElementById("ecr-status-log");
          const logSnapshot = logEl ? logEl.innerHTML : "";

          Swal.close();
          await ecrLogoff(sessionId, lastUsedRef);

          Swal.fire({
            icon: "error",
            title: isDuplicateDuringPoll ? "Duplicate Transaction" : "Payment Declined",
            html: `
              <p>${msg || "The transaction was declined by the terminal."}</p>
              ${code ? `<p class="mt-1 text-sm text-gray-500">Code: ${code}</p>` : ""}
              <details class="mt-3 text-left">
                <summary class="text-xs text-gray-400 cursor-pointer">View Transaction Log</summary>
                <div class="bg-gray-50 border rounded p-2 max-h-36 overflow-y-auto text-xs font-mono mt-1">
                  ${logSnapshot}
                </div>
              </details>
            `,
            width: 480,
          });
          setLoading(false);

        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);

          const logEl = document.getElementById("ecr-status-log");
          const logSnapshot = logEl ? logEl.innerHTML : "";

          Swal.close();
          await ecrLogoff(sessionId, lastUsedRef);

          Swal.fire({
            icon: "warning",
            title: "Payment Timeout",
            html: `
              <p>The transaction did not complete within 60 seconds.</p>
              <details class="mt-3 text-left">
                <summary class="text-xs text-gray-400 cursor-pointer">View Transaction Log</summary>
                <div class="bg-gray-50 border rounded p-2 max-h-36 overflow-y-auto text-xs font-mono mt-1">
                  ${logSnapshot}
                </div>
              </details>
            `,
            width: 480,
          });
          setLoading(false);
        }
        // else: still pending/processing, keep polling

      } catch (error) {
        clearInterval(pollInterval);
        Swal.close();
        setLoading(false);
        throw error;
      }
    }, 1000);
  };

  // Complete ECR / ATH Móvil transaction
  const completeECRTransaction = async (
    sessionId: string,
    lastStatusRef: number,
    paymentData: ECRPaymentData,
    methodLabel: string = 'ECR Terminal',
    setLoading: (v: boolean) => void = setEcrLoading,
  ) => {
    console.log("ECR: Completing approved transaction...");
    console.log("ECR: Payment data:", paymentData);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: userLat, longitude: userLng } = position.coords;

      // Use trx_id as the payment reference; fall back to form ref
      const approvalRef =
        paymentData.trx_id ||
        paymentData.reference ||
        form?.referenceNumber;

      const cardType = paymentData.special_account
        ? CARD_TYPE_MAP[paymentData.special_account] || paymentData.special_account
        : "N/A";
      const cardLastFour = paymentData.pan_card_number || "N/A";

      const sendForm = {
        latitude: locationMode === "manual" ? latitude : userLat,
        longitude: locationMode === "manual" ? longitude : userLng,
        propertyId,
        ticketId: ticketId,
        pin: form?.pin || "",
        amount: totalAmount,
        paymentMethod: `${methodLabel} - ${form?.paymentMethod}`,
        referenceNumber: approvalRef,
        notes: [
          form?.notes || "",
          `Card: ${cardType} ending in ${cardLastFour}`,
          paymentData.response_message ? `Response: ${paymentData.response_message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };

      try {
        const res = await fetch("/api/valetTransaction/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });
        const result = await res.json();

        // End terminal session after successful transaction
        await ecrLogoff(sessionId, lastStatusRef);

        console.log("ECR: Transaction recorded in valet system:", result);

        if (result?.result?.status == "200") {
          console.log("ECR: Transaction completed successfully!");
          setOpen(false);
          setReloadPageData(true);
          setLoading(false);

          Swal.fire({
            icon: "success",
            title: "Payment Successful",
            html: `
              <p>Transaction completed successfully!</p>
              <p class="mt-2 text-sm font-semibold text-green-600">${paymentData.response_message || "APPROVED"}</p>
              <p class="mt-1 text-sm">Transaction ID: <strong>${paymentData.trx_id || "N/A"}</strong></p>
              <p class="text-sm">Card: ${cardType} ending in ${cardLastFour}</p>
            `,
            showConfirmButton: false,
            timer: 4000,
          });
          setForm({
            amount: 0,
            paymentMethod: "",
            referenceNumber: "",
            notes: "",
          });
        } else {
          console.error("ECR: Failed to record transaction:", result);
          throw new Error(
            result?.result?.message || "Transaction recording failed",
          );
        }
      } catch (error) {
        console.error("ECR: Error completing transaction:", error);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Transaction Error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to record transaction.",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-5 space-y-4">
      <form className="space-y-4">
        {/* Header info */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm">
            <MdOutlineReceiptLong className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Ticket <span className="font-semibold text-gray-900">#{form?.referenceNumber}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaMoneyBillWave className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">
              ${taxBreakdown ? taxBreakdown.total.toFixed(2) : (price ?? 0)}
            </span>
          </div>
        </div>

        {/* Transaction Type Select */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Type</p>
          <div className="space-y-2">
            {transactionTypes?.map((option) => (
              <button
                key={option?.id}
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, paymentMethod: option.name, value: option.value }));
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm cursor-pointer ${
                  form.paymentMethod === option.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }`}
              >
                <span className="font-medium text-gray-900">{option?.name}</span>
                <span className={`font-semibold ${
                  form.paymentMethod === option.name ? "text-blue-600" : "text-gray-600"
                }`}>${Number(option?.value).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tax Breakdown */}
        {taxBreakdown && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Base amount</span>
              <span>${taxBreakdown.base.toFixed(2)}</span>
            </div>
            {taxBreakdown.stateTaxRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>IVU Estatal ({taxBreakdown.stateTaxRate}%)</span>
                <span>+${taxBreakdown.stateTax.toFixed(2)}</span>
              </div>
            )}
            {taxBreakdown.cityTaxRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>IVU Municipal ({taxBreakdown.cityTaxRate}%)</span>
                <span>+${taxBreakdown.cityTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
              <span>Total</span>
              <span>${taxBreakdown.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* PIN */}
        <FormInput
          name="pin"
          type="text"
          placeholder="4-digit PIN"
          icon={<MdPassword className="w-4 h-4" />}
          value={form?.pin || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d{0,4}$/.test(val)) {
              setForm((prev) => ({ ...prev, pin: val }));
            }
          }}
          required
          showPasswordToggle
          showPassword={showPin}
          setShowPassword={setShowPin}
          missing={missingFields.includes("pin")}
          onClear={() => setForm((prev) => ({ ...prev, pin: "" }))}
        />

        {/* Notes */}
        <textarea
          name="notes"
          value={form.notes || ""}
          onChange={handleChange}
          placeholder="Notes (optional)"
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-20"
        />

        {/* Courtesy Button — Admin only */}
        {isAdmin && (
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCourtesy}
              disabled={courtesyLoading || !form?.pin || form.pin.length !== 4}
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <MdCardGiftcard className="w-4 h-4" />
              {courtesyLoading ? "Applying..." : "Give Courtesy"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-1">
              Admin only &mdash; requires a reason
            </p>
          </div>
        )}

        {/* Payment Method Buttons */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handlePlaceToPayPayment}
              type="button"
              disabled={placeToPayLoading || !form?.paymentMethod || !propertyId || form?.pin?.length !== 4}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RiSecurePaymentFill className="w-4 h-4" />
              {placeToPayLoading ? "..." : "PlaceToPay"}
            </button>

            <button
              onClick={handleATHMovilPayment}
              type="button"
              disabled={athMovilLoading || !form?.paymentMethod || !propertyId || form?.pin?.length !== 4}
              className="h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <MdPayment className="w-4 h-4" />
              {athMovilLoading ? "..." : "ATH Móvil"}
            </button>

            <button
              onClick={handleECRPayment}
              type="button"
              disabled={ecrLoading || !form?.paymentMethod || !propertyId || form?.pin?.length !== 4}
              className="h-11 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaCreditCard className="w-4 h-4" />
              {ecrLoading ? "..." : "ECR Terminal"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or record manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleSubmit}
            type="button"
            disabled={loader || !propertyId}
            className="w-full h-11 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium rounded-xl transition-colors text-sm cursor-pointer"
          >
            {loader ? "Submitting..." : "Record Manual Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
