"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import FormInput from "./elements/FormInput";
import { FaCreditCard } from "react-icons/fa";
import {
  MdCardGiftcard,
  MdOutlineReceiptLong,
  MdPassword,
  MdPayment,
} from "react-icons/md";
import { RiSecurePaymentFill } from "react-icons/ri";
import { TaxBreakdown } from "../types";
import { useProperty } from "../context/PropertyContext";

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string;
  pin?: string;
  value?: number;
}

interface TransactionFormProps {
  form: TransactionForm;
  setForm: React.Dispatch<React.SetStateAction<TransactionForm>>;
  ticketId?: string;
  missingFields?: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  latitude?: number;
  longitude?: number;
  locationMode?: "live" | "manual";
  propertyId?: string | null;
}

interface TransactionType {
  id: string;
  name: string;
  value: number;
  taxable?: boolean;
  stateTaxRate?: number;
  cityTaxRate?: number;
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

interface ECRPaymentData {
  approval_code?: string;
  response_message?: string;
  special_account?: string;
  pan_card_number?: string;
  amounts?: { total?: string };
  receipt?: string;
  trx_id?: string;
  reference?: string;
  transaction_type_indicator?: string;
  entry_type?: string;
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

  return {
    base,
    stateTax,
    stateTaxRate: sRate,
    cityTax,
    cityTaxRate: cRate,
    total,
  };
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
  const {
    accountUser,
    userRole,
    latitude: ctxLatitude,
    longitude: ctxLongitude,
  } = useProperty();

  const isAdmin = userRole?.toLowerCase() === "admin" || userRole === "1";

  const [loader, setLoader] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [courtesyLoading, setCourtesyLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(
    []
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

    return () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const generateTicketNumber = () => {
    const alphanumericSix = uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase();

    setForm((prev) => ({ ...prev, referenceNumber: alphanumericSix }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "paymentMethod") {
      const selected = transactionTypes?.find((t) => t.name === value);
      setForm((prev) => ({
        ...prev,
        paymentMethod: value,
        value: selected?.value || 0,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectedTransactionType = transactionTypes?.find(
    (t) => t?.name === form?.paymentMethod
  );

  const price = selectedTransactionType?.value;
  const taxBreakdown: TaxBreakdown | null = selectedTransactionType
    ? buildTaxBreakdown(selectedTransactionType)
    : null;

  const totalAmount = taxBreakdown ? taxBreakdown.total : Number(price) || 0;

  const CARD_TYPE_MAP: Record<string, string> = {
    VC: "Visa",
    MC: "MasterCard",
    AT: "ATH Debit",
    AX: "Amex",
    DC: "Discover",
    IC: "Cash",
    UN: "UnionPay",
    EB: "EBT Food",
    EC: "EBT Cash",
    AM: "ATH Móvil",
    BA: "Health Card",
    FN: "Fondo",
  };

  const resetForm = () => {
    setForm({
      amount: 0,
      paymentMethod: "",
      referenceNumber: "",
      notes: "",
      pin: "",
      value: 0,
    });
  };

  const validateTransactionType = () => {
    if (!form?.paymentMethod || !selectedTransactionType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a transaction type first.",
        confirmButtonColor: "#d6a800",
      });
      return false;
    }

    return true;
  };

  const validateTicketId = () => {
    if (!ticketId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ticket ID is missing. Please try again.",
        confirmButtonColor: "#d6a800",
      });
      return false;
    }

    return true;
  };

  const validatePin = () => {
    if (!form?.pin || form.pin.length !== 4) {
      Swal.fire({
        icon: "warning",
        title: "PIN Required",
        text: "Please enter your 4-digit PIN before continuing.",
        confirmButtonColor: "#d6a800",
      });
      return false;
    }

    return true;
  };

  const resolveLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    if (locationMode === "manual") {
      return {
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve({
            latitude: ctxLatitude ?? 0,
            longitude: ctxLongitude ?? 0,
          });
        }
      );
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form?.paymentMethod || !form?.referenceNumber) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
        confirmButtonColor: "#d6a800",
      });
      return;
    }

    setLoader(true);

    try {
      const location = await resolveLocation();

      const sendForm = {
        latitude: location.latitude,
        longitude: location.longitude,
        propertyId,
        ticketId,
        pin: form?.pin || "",
        amount: totalAmount,
        paymentMethod: form?.paymentMethod,
        referenceNumber: form?.referenceNumber,
        notes: form?.notes,
      };

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

        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text:
            result?.result?.message ||
            "Something went wrong. Please try again.",
          confirmButtonColor: "#d6a800",
        });
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#d6a800",
      });
    } finally {
      setLoader(false);
    }
  };

  const handleCourtesy = async () => {
    if (!validatePin()) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Give Courtesy",
      html: `
        <p class="text-sm text-gray-600 mb-3">Ticket <strong>#${form?.referenceNumber}</strong> will be waived. Please provide a reason.</p>
        <textarea id="courtesy-reason" class="swal2-textarea w-full" placeholder="Enter reason for courtesy..." rows="3" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:14px;"></textarea>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Apply Courtesy",
      confirmButtonColor: "#d6a800",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const el = document.getElementById(
          "courtesy-reason"
        ) as HTMLTextAreaElement;
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

        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Courtesy Failed",
          text:
            result?.result?.message ||
            "Could not apply courtesy. Please try again.",
          confirmButtonColor: "#d6a800",
        });
      }
    } catch (error) {
      console.error("Courtesy error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
        confirmButtonColor: "#d6a800",
      });
    } finally {
      setCourtesyLoading(false);
    }
  };

  const handlePlaceToPayPayment = async () => {
    if (!validateTransactionType()) return;
    if (!validateTicketId()) return;
    if (!validatePin()) return;

    setPlaceToPayLoading(true);

    try {
      const ticketRes = await fetch("/api/getTicketDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId }),
      });

      if (!ticketRes.ok) {
        throw new Error("Failed to fetch ticket details");
      }

      const ticketData = await ticketRes.json();
      const patron = ticketData?.data?.patron;

      if (!patron) {
        Swal.fire({
          icon: "error",
          title: "Missing Patron Information",
          text: "Unable to retrieve customer information. Please try again.",
          confirmButtonColor: "#d6a800",
        });
        setPlaceToPayLoading(false);
        return;
      }

      const patronEmail =
        patron.email || `${patron.phoneNumber}@temp.valet.com`;

      if (!patronEmail && !patron.phoneNumber) {
        Swal.fire({
          icon: "error",
          title: "Missing Contact Information",
          text: "Customer email or phone number is required for online payment.",
          confirmButtonColor: "#d6a800",
        });
        setPlaceToPayLoading(false);
        return;
      }

      const checkoutRes = await fetch("/api/payments/placetopay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          patronName: patron.firstName || "Guest",
          patronSurname: patron.lastName || "",
          patronEmail,
          patronPhone: patron.phoneNumber,
          amount: totalAmount,
          transactionTypeId: selectedTransactionType?.id,
          transactionDescription: `${form.paymentMethod} - Valet Parking Service`,
          propertyReference: propertyId || "VP",
        }),
      });

      if (!checkoutRes.ok) {
        const errorData = await checkoutRes.json();
        throw new Error(
          errorData.message || "Failed to create payment session"
        );
      }

      const checkoutData = await checkoutRes.json();

      if (!checkoutData.success || !checkoutData.processUrl) {
        throw new Error(
          checkoutData.message || "Invalid payment session response"
        );
      }

      const newWindow = window.open(checkoutData.processUrl, "_blank");
      setPaymentWindow(newWindow);

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
        confirmButtonColor: "#d6a800",
        allowOutsideClick: false,
        didOpen: () => {
          pollPlaceToPayStatus(checkoutData.requestId, newWindow);
        },
      }).then((result) => {
        if (
          result.isDismissed &&
          result.dismiss === Swal.DismissReason.cancel
        ) {
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
          <p class="mt-2 text-xs text-gray-500">Check console for more details.</p>
        `,
        confirmButtonColor: "#d6a800",
      });

      setPlaceToPayLoading(false);
    }
  };

  const pollPlaceToPayStatus = async (
    requestId: number,
    paymentWin: Window | null
  ) => {
    const maxAttempts = 20;
    let attempts = 0;

    const intervalId = setInterval(async () => {
      attempts++;

      try {
        const statusRes = await fetch(
          `/api/payments/placetopay/session/${requestId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!statusRes.ok) {
          throw new Error("Failed to verify payment status");
        }

        const statusData = await statusRes.json();

        if (statusData.isApproved) {
          clearInterval(intervalId);
          setPollingIntervalId(null);
          Swal.close();

          await completeTransaction(statusData);

          if (paymentWin && !paymentWin.closed) {
            paymentWin.close();
          }
        } else if (statusData.isRejected) {
          clearInterval(intervalId);
          setPollingIntervalId(null);
          Swal.close();

          if (paymentWin && !paymentWin.closed) {
            paymentWin.close();
          }

          Swal.fire({
            icon: "error",
            title: "Payment Rejected",
            text:
              statusData.message ||
              "The payment was rejected. Please try again.",
            confirmButtonColor: "#d6a800",
          });

          setPlaceToPayLoading(false);
        }

        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollingIntervalId(null);
          Swal.close();

          Swal.fire({
            icon: "warning",
            title: "Verification Timeout",
            text: "Payment verification timed out. Please check your payment status manually.",
            showCancelButton: true,
            confirmButtonText: "Check Status Now",
            cancelButtonText: "Close",
            confirmButtonColor: "#d6a800",
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
          confirmButtonColor: "#d6a800",
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
    }, 3000);

    setPollingIntervalId(intervalId);
  };

  const verifyPaymentStatus = async (requestId: number) => {
    try {
      const statusRes = await fetch(
        `/api/payments/placetopay/session/${requestId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!statusRes.ok) {
        throw new Error("Failed to verify payment status");
      }

      const statusData = await statusRes.json();

      if (!statusData.success) {
        throw new Error(statusData.message || "Invalid status response");
      }

      if (statusData.isApproved) {
        await completeTransaction(statusData);
      } else if (statusData.isPending) {
        Swal.fire({
          icon: "warning",
          title: "Payment Still Pending",
          text: "Payment is still being processed. Would you like to check again?",
          showCancelButton: true,
          confirmButtonText: "Check Again",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#d6a800",
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
          confirmButtonColor: "#d6a800",
        });

        setPlaceToPayLoading(false);
      }
    } catch (error) {
      console.error("PlaceToPay manual verification error:", error);

      Swal.fire({
        icon: "error",
        title: "Verification Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to verify payment status.",
        confirmButtonColor: "#d6a800",
      });

      setPlaceToPayLoading(false);
    }
  };

  const completeTransaction = async (paymentData: PaymentStatusData) => {
    try {
      const location = await resolveLocation();

      const sendForm = {
        latitude: location.latitude,
        longitude: location.longitude,
        propertyId,
        ticketId,
        pin: form?.pin || "",
        amount: totalAmount,
        paymentMethod: `PlaceToPay - ${form?.paymentMethod}`,
        referenceNumber:
          paymentData.payment?.authorization || form?.referenceNumber,
        notes: `${form?.notes || ""}\nPlaceToPay Receipt: ${
          paymentData.payment?.receipt || "N/A"
        }`,
      };

      const res = await fetch("/api/valetTransaction/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const result = await res.json();

      if (result?.result?.status == "200") {
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
            <p class="mt-2 text-sm">Authorization: ${
              paymentData.payment?.authorization || "N/A"
            }</p>
            <p class="text-sm">Receipt: ${
              paymentData.payment?.receipt || "N/A"
            }</p>
          `,
          showConfirmButton: false,
          timer: 3000,
        });

        resetForm();
      } else {
        throw new Error(
          result?.result?.message || "Transaction recording failed"
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
        confirmButtonColor: "#d6a800",
      });
    } finally {
      setPlaceToPayLoading(false);
    }
  };

  const handleECRPayment = async () => {
    if (ecrLoading) return;
    if (!validateTransactionType()) return;
    if (!validateTicketId()) return;
    if (!validatePin()) return;

    setEcrLoading(true);

    const startRef = Math.floor(Math.random() * 89999) + 10000;
    let currentRef = startRef;
    let sessionId = "";

    try {
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

      if (!logonData.success || !logonData.session_id) {
        throw new Error("Invalid terminal session response");
      }

      sessionId = logonData.session_id;
      currentRef = startRef + 1;

      let forceDuplicate = false;
      let saleData: { trx_id?: string; message?: string } | null = null;

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

          if (
            saleRes.status === 409 &&
            errorData.error === "DUPLICATE_TRANSACTION" &&
            attempt === 0
          ) {
            Swal.close();

            const decision = await showDuplicateDecisionModal(
              sessionId,
              currentRef.toString(),
              startRef.toString()
            );

            if (decision.force) {
              forceDuplicate = true;
              currentRef = decision.journalRef + 1;

              Swal.fire({
                title: "Payment Terminal",
                html:
                  "<p>Retrying payment with duplicate confirmation...</p><p class='text-sm mt-2'>Amount: $" +
                  totalAmount.toFixed(2) +
                  "</p>",
                icon: "info",
                showConfirmButton: false,
                allowOutsideClick: false,
              });

              continue;
            }

            await ecrLogoff(sessionId, decision.journalRef);
            setEcrLoading(false);
            return;
          }

          if (errorData.details?.error?.includes("ALREADY IN USE")) {
            await ecrLogoff(sessionId, currentRef);
            throw new Error("Terminal session conflict. Please try again.");
          }

          throw new Error(
            errorData.message || "Failed to initiate terminal payment"
          );
        }

        saleData = await saleRes.json();
        break;
      }

      if (!saleData?.trx_id) {
        throw new Error(
          saleData?.message || "Invalid sale response - no transaction ID"
        );
      }

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
        confirmButtonColor: "#d6a800",
      });

      if (sessionId && currentRef > 0) {
        await ecrLogoff(sessionId, currentRef);
      }

      setEcrLoading(false);
    }
  };

  const handleATHMovilPayment = async () => {
    if (athMovilLoading) return;
    if (!validateTransactionType()) return;
    if (!validateTicketId()) return;
    if (!validatePin()) return;

    setAthMovilLoading(true);

    const startRef = Math.floor(Math.random() * 89999) + 10000;
    let currentRef = startRef;
    let sessionId = "";

    try {
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

      if (!logonData.success || !logonData.session_id) {
        throw new Error("Invalid terminal session response");
      }

      sessionId = logonData.session_id;
      currentRef = startRef + 1;

      let forceDuplicate = false;
      let saleData: { trx_id?: string; message?: string } | null = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        Swal.fire({
          title: "ATH Móvil Payment",
          html:
            "<p>Waiting for the customer to complete payment via ATH Móvil.</p><p class='text-sm mt-2'>Amount: $" +
            totalAmount.toFixed(2) +
            (forceDuplicate
              ? "</p><p class='text-xs text-yellow-600 mt-1'>Force duplicate enabled</p>"
              : "</p>"),
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        const saleRes = await fetch(
          "/api/payments/evertec/sales/start-ath-movil-sale",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              reference: currentRef.toString(),
              last_reference: (currentRef - 1).toString(),
              amount: totalAmount,
              ...(forceDuplicate ? { force_duplicate: "yes" } : {}),
            }),
          }
        );

        if (!saleRes.ok) {
          const errorData = await saleRes
            .json()
            .catch(() => ({ error: "Unknown error" }));

          if (
            saleRes.status === 409 &&
            errorData.error === "DUPLICATE_TRANSACTION" &&
            attempt === 0
          ) {
            Swal.close();

            const decision = await showDuplicateDecisionModal(
              sessionId,
              currentRef.toString(),
              startRef.toString()
            );

            if (decision.force) {
              forceDuplicate = true;
              currentRef = decision.journalRef + 1;
              continue;
            }

            await ecrLogoff(sessionId, decision.journalRef);
            setAthMovilLoading(false);
            return;
          }

          if (errorData.details?.error?.includes("ALREADY IN USE")) {
            await ecrLogoff(sessionId, currentRef);
            throw new Error("Terminal session conflict. Please try again.");
          }

          throw new Error(
            errorData.message || "Failed to initiate ATH Móvil payment"
          );
        }

        saleData = await saleRes.json();
        break;
      }

      if (!saleData?.trx_id) {
        throw new Error(
          saleData?.message || "Invalid sale response - no transaction ID"
        );
      }

      await pollECRStatus(
        sessionId,
        saleData.trx_id,
        currentRef,
        "ATH Móvil",
        setAthMovilLoading
      );
    } catch (error) {
      console.error("ATH Móvil payment error:", error);

      Swal.fire({
        icon: "error",
        title: "ATH Móvil Payment Error",
        text:
          error instanceof Error
            ? error.message
            : "Payment communication failed",
        confirmButtonColor: "#d6a800",
      });

      if (sessionId && currentRef > 0) {
        await ecrLogoff(sessionId, currentRef);
      }

      setAthMovilLoading(false);
    }
  };

  const queryJournalForReference = async (
    sessionId: string,
    reference: string,
    lastReference: string,
    targetReference: string
  ): Promise<{
    found: boolean;
    transaction?: Record<string, unknown>;
    error?: string;
  }> => {
    try {
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
        return {
          found: false,
          error: data.response_message || "Journal rejected",
        };
      }

      return { found: true, transaction: data.reference_value };
    } catch (e) {
      console.error("Journal query error:", e);
      return { found: false, error: "Journal request failed" };
    }
  };

  const showDuplicateDecisionModal = async (
    sessionId: string,
    saleReference: string,
    lastSuccessfulRef: string
  ): Promise<{ force: boolean; journalRef: number }> => {
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
      "all"
    );

    const journalRefUsed = parseInt(saleReference, 10) + 1;

    let journalHtml = "";

    if (journalResult.found && journalResult.transaction) {
      const txnDetails: string[] = [];
      const refValue = journalResult.transaction as Record<string, unknown>;
      const hosts = Object.keys(refValue);

      for (const host of hosts) {
        const hostData = refValue[host] as Record<string, unknown> | undefined;
        if (!hostData) continue;

        const transactions = (
          hostData as { trans?: Array<Record<string, unknown>> }
        ).trans;

        if (Array.isArray(transactions)) {
          for (const txn of transactions) {
            const status =
              txn.approval_code === "00" ? "APPROVED" : "DECLINED";
            const statusColor =
              txn.approval_code === "00" ? "text-green-600" : "text-red-600";
            const cardName =
              CARD_TYPE_MAP[txn.special_account as string] ||
              txn.special_account ||
              "N/A";

            txnDetails.push(`
              <div class="border rounded p-2 mb-2 text-left text-sm">
                <div class="flex justify-between">
                  <span class="font-semibold">${
                    txn.transaction_type || "Transaction"
                  }</span>
                  <span class="font-bold ${statusColor}">${status}</span>
                </div>
                <div class="text-gray-600 mt-1">
                  Ref: ${txn.reference || "N/A"} | Amount: $${
                    (txn.amounts as Record<string, string>)?.total || "N/A"
                  }
                </div>
                <div class="text-gray-600">
                  ${cardName} ending in ${
                    txn.pan_card_number || "N/A"
                  } | ${txn.transaction_time || ""}
                </div>
              </div>
            `);
          }
        }
      }

      journalHtml =
        txnDetails.length > 0
          ? `
            <div class="mt-3 max-h-48 overflow-y-auto">
              <p class="text-sm font-semibold mb-2 text-left">Batch Transactions:</p>
              ${txnDetails.join("")}
            </div>
          `
          : `<p class="text-sm text-gray-500 mt-2">No transactions found in current batch.</p>`;
    } else {
      journalHtml = `<p class="text-sm text-yellow-600 mt-2">Could not retrieve journal: ${
        journalResult.error || "Unknown error"
      }</p>`;
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

  const resolveECROutcome = (
    data: ECRPaymentData
  ): "approved" | "declined" | "pending" => {
    const approvalCode = (data.approval_code || "").trim().toUpperCase();
    const responseMsg = (data.response_message || "").toUpperCase();

    if (approvalCode === "00") return "approved";
    if (approvalCode === "ZY") return "declined";
    if (approvalCode === "ST") return "pending";

    if (
      responseMsg === "APPROVED." ||
      responseMsg === "APPROVED" ||
      responseMsg === "APROBADO"
    ) {
      return "approved";
    }

    if (
      responseMsg.includes("DECLIN") ||
      responseMsg.includes("CANCELLED") ||
      responseMsg.includes("CANCEL") ||
      responseMsg.includes("DENIED") ||
      responseMsg.includes("REJECT") ||
      responseMsg.includes("NOT APPROVED") ||
      responseMsg.includes("RECHAZADO")
    ) {
      return "declined";
    }

    return "pending";
  };

  const formatLogTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
  };

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

  const appendStatusLog = (
    code: string,
    message: string,
    attempt: number,
    maxAttempts: number
  ) => {
    const logEl = document.getElementById("ecr-status-log");
    const counterEl = document.getElementById("ecr-poll-counter");

    if (!logEl) return;

    let colorClass = "text-gray-600";
    let icon = "⏳";

    if (code === "00") {
      colorClass = "text-green-600 font-semibold";
      icon = "✅";
    } else if (code === "ZY") {
      colorClass = "text-red-600 font-semibold";
      icon = "❌";
    } else if (code === "ST") {
      icon = "🔄";
    }

    const isDuplicate = message.toUpperCase().includes("DUPLICAT");

    if (isDuplicate) {
      colorClass = "text-orange-600 font-semibold";
      icon = "⚠️";
    }

    const entry = document.createElement("div");
    entry.className = `${colorClass} py-0.5 border-b border-gray-100 last:border-0`;
    entry.innerHTML = `${icon} ${formatLogTime()} — [${
      code || "??"
    }] ${message || "No message"}`;

    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;

    if (counterEl) {
      counterEl.textContent = `Poll: ${attempt}/${maxAttempts}`;
    }
  };

  const pollECRStatus = async (
    sessionId: string,
    trxId: string,
    lastUsedRef: number,
    methodLabel: string = "ECR Terminal",
    setLoading: (v: boolean) => void = setEcrLoading
  ) => {
    const maxAttempts = 60;
    let attempts = 0;

    showStatusLogModal(methodLabel, totalAmount);

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const statusRes = await fetch(
          "/api/payments/ecr/transaction/get-status",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, trx_id: trxId }),
          }
        );

        if (!statusRes.ok) {
          appendStatusLog("ERR", "Status check failed", attempts, maxAttempts);
          throw new Error("Status check failed");
        }

        const statusData = await statusRes.json();
        const outcome = resolveECROutcome(statusData);
        const code = statusData.approval_code || "";
        const msg = statusData.response_message || "";

        appendStatusLog(code, msg, attempts, maxAttempts);

        const isDuplicateDuringPoll = msg.toUpperCase().includes("DUPLICAT");

        if (outcome === "approved") {
          clearInterval(pollInterval);
          Swal.close();

          await completeECRTransaction(
            sessionId,
            lastUsedRef,
            statusData,
            methodLabel,
            setLoading
          );
        } else if (outcome === "declined") {
          clearInterval(pollInterval);

          const logEl = document.getElementById("ecr-status-log");
          const logSnapshot = logEl ? logEl.innerHTML : "";

          Swal.close();
          await ecrLogoff(sessionId, lastUsedRef);

          Swal.fire({
            icon: "error",
            title: isDuplicateDuringPoll
              ? "Duplicate Transaction"
              : "Payment Declined",
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
            confirmButtonColor: "#d6a800",
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
            confirmButtonColor: "#d6a800",
          });

          setLoading(false);
        }
      } catch (error) {
        clearInterval(pollInterval);
        Swal.close();
        setLoading(false);

        Swal.fire({
          icon: "error",
          title: "Terminal Error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to check terminal status.",
          confirmButtonColor: "#d6a800",
        });
      }
    }, 1000);
  };

  const completeECRTransaction = async (
    sessionId: string,
    lastStatusRef: number,
    paymentData: ECRPaymentData,
    methodLabel: string = "ECR Terminal",
    setLoading: (v: boolean) => void = setEcrLoading
  ) => {
    try {
      const location = await resolveLocation();

      const approvalRef =
        paymentData.trx_id || paymentData.reference || form?.referenceNumber;

      const cardType = paymentData.special_account
        ? CARD_TYPE_MAP[paymentData.special_account] ||
          paymentData.special_account
        : "N/A";

      const cardLastFour = paymentData.pan_card_number || "N/A";

      const sendForm = {
        latitude: location.latitude,
        longitude: location.longitude,
        propertyId,
        ticketId,
        pin: form?.pin || "",
        amount: totalAmount,
        paymentMethod: `${methodLabel} - ${form?.paymentMethod}`,
        referenceNumber: approvalRef,
        notes: [
          form?.notes || "",
          `Card: ${cardType} ending in ${cardLastFour}`,
          paymentData.response_message
            ? `Response: ${paymentData.response_message}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };

      const res = await fetch("/api/valetTransaction/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const result = await res.json();

      await ecrLogoff(sessionId, lastStatusRef);

      if (result?.result?.status == "200") {
        setOpen(false);
        setReloadPageData(true);
        setLoading(false);

        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          html: `
            <p>Transaction completed successfully!</p>
            <p class="mt-2 text-sm font-semibold text-green-600">${
              paymentData.response_message || "APPROVED"
            }</p>
            <p class="mt-1 text-sm">Transaction ID: <strong>${
              paymentData.trx_id || "N/A"
            }</strong></p>
            <p class="text-sm">Card: ${cardType} ending in ${cardLastFour}</p>
          `,
          showConfirmButton: false,
          timer: 4000,
        });

        resetForm();
      } else {
        throw new Error(
          result?.result?.message || "Transaction recording failed"
        );
      }
    } catch (error) {
      console.error("ECR transaction completion error:", error);

      setLoading(false);

      Swal.fire({
        icon: "error",
        title: "Transaction Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to record transaction.",
        confirmButtonColor: "#d6a800",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-4xl bg-white">
      <form className="space-y-7 p-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-600">
                Payment Session
              </p>

              <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-slate-950">
                #{form?.referenceNumber || "TKT"}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Select rate, verify PIN, and complete the valet transaction.
              </p>
            </div>

            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-700">
              Secure Checkout
            </div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
              <MdOutlineReceiptLong className="text-amber-600" />
              Select Rate
            </h3>

            {selectedTransactionType && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                {selectedTransactionType.name}
              </span>
            )}
          </div>

          {transactionTypes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
              No transaction types found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {transactionTypes.map((option) => {
                const active = form.paymentMethod === option.name;
                const optionTax = buildTaxBreakdown(option);
                const optionTotal = optionTax
                  ? optionTax.total
                  : Number(option.value) || 0;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        paymentMethod: option.name,
                        value: option.value,
                      }));
                    }}
                    className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                      active
                        ? "border-amber-400 bg-amber-50 shadow-[0_12px_28px_rgba(217,174,38,0.16)]"
                        : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-extrabold ${
                          active ? "text-amber-800" : "text-slate-900"
                        }`}
                      >
                        {option.name}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {option.taxable ? "Taxable rate" : "Flat rate"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-black ${
                          active ? "text-amber-700" : "text-slate-900"
                        }`}
                      >
                        ${optionTotal.toFixed(2)}
                      </p>

                      {option.taxable && (
                        <p className="text-[11px] font-bold text-slate-400">
                          incl. tax
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {taxBreakdown && (
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base amount</span>
                <span>${taxBreakdown.base.toFixed(2)}</span>
              </div>

              {taxBreakdown.stateTaxRate > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>IVU Estatal ({taxBreakdown.stateTaxRate}%)</span>
                  <span>+${taxBreakdown.stateTax.toFixed(2)}</span>
                </div>
              )}

              {taxBreakdown.cityTaxRate > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>IVU Municipal ({taxBreakdown.cityTaxRate}%)</span>
                  <span>+${taxBreakdown.cityTax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-2 font-extrabold text-slate-950">
                <span>Total</span>
                <span>${taxBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
            <RiSecurePaymentFill className="text-amber-600" />
            Security PIN
          </h3>

          <FormInput
            name="pin"
            type="text"
            placeholder="4-digit PIN"
            icon={<MdPassword className="h-4 w-4" />}
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

          <p className="mt-2 text-xs font-medium text-slate-400">
            Required for vehicle retrieval verification.
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
            Payment Method
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={handlePlaceToPayPayment}
              type="button"
              disabled={
                placeToPayLoading ||
                !form?.paymentMethod ||
                !propertyId ||
                form?.pin?.length !== 4
              }
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
            >
              <RiSecurePaymentFill className="h-4 w-4" />
              {placeToPayLoading ? "..." : "PlaceToPay"}
            </button>

            <button
              onClick={handleATHMovilPayment}
              type="button"
              disabled={
                athMovilLoading ||
                !form?.paymentMethod ||
                !propertyId ||
                form?.pin?.length !== 4
              }
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 text-sm font-extrabold text-amber-700 transition hover:bg-amber-500 hover:text-white disabled:opacity-50"
            >
              <MdPayment className="h-4 w-4" />
              {athMovilLoading ? "..." : "ATH Móvil"}
            </button>

            <button
              onClick={handleECRPayment}
              type="button"
              disabled={
                ecrLoading ||
                !form?.paymentMethod ||
                !propertyId ||
                form?.pin?.length !== 4
              }
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
            >
              <FaCreditCard className="h-4 w-4" />
              {ecrLoading ? "..." : "ECR Terminal"}
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
            Internal Notes
          </h3>

          <textarea
            name="notes"
            value={form.notes || ""}
            onChange={handleChange}
            placeholder="Add any special handling instructions or transaction notes..."
            className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
        </section>

        {isAdmin && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <button
              type="button"
              onClick={handleCourtesy}
              disabled={courtesyLoading || !form?.pin || form.pin.length !== 4}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(217,174,38,0.28)] transition hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
            >
              <MdCardGiftcard className="h-4 w-4" />
              {courtesyLoading ? "Applying..." : "Give Courtesy"}
            </button>

            <p className="mt-2 text-center text-xs font-medium text-slate-500">
              Admin only — requires a reason and valid PIN.
            </p>
          </section>
        )}
      </form>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Total Balance
            </p>

            <p className="font-serif text-4xl font-bold text-slate-950">
              ${totalAmount.toFixed(2)}
              <span className="ml-2 text-xs font-medium text-slate-500">
                {taxBreakdown ? "incl. tax" : "flat rate"}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-14 rounded-2xl border border-slate-200 bg-white px-8 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>

            <button
              onClick={handleSubmit}
              type="button"
              disabled={loader || !propertyId || !form?.paymentMethod}
              className="h-14 rounded-2xl bg-amber-500 px-10 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(217,174,38,0.28)] transition hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
            >
              {loader ? "Submitting..." : "Manual Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}