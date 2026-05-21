/**
 * Evertec ATH Móvil Sale API Route
 * POST /api/payments/evertec/sales/start-ath-movil-sale
 *
 * Initiates an ATH Móvil payment via the Evertec middleware.
 * The customer completes payment on their mobile device.
 * Returns trx_id for status polling via the shared ECR get-status endpoint.
 *
 * Body:
 *   session_id      — active terminal session from logon
 *   reference       — incrementing reference number
 *   last_reference  — previous reference number
 *   amount          — total amount to charge (number, e.g. 25.50)
 *   terminal_url    — (optional) override EVERTEC_ECR_TERMINAL_URL from .env
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { generateECRAmounts } from '@/app/helpers/tax-calculator';
import { ECRSaleResponse, ECRError } from '@/app/types/ecr';

interface StartATHMovilSaleRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  amount: number;
  /** "yes" to force duplicate transaction through (default: "no") */
  force_duplicate?: 'yes' | 'no';
  /** Optional — overrides EVERTEC_ECR_TERMINAL_URL */
  terminal_url?: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_ID */
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StartATHMovilSaleRequestBody = await request.json();

    console.log('ATH Móvil Sale - Received request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (
      !body.session_id ||
      !body.reference ||
      !body.last_reference ||
      !body.amount ||
      body.amount <= 0
    ) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing or invalid required fields',
          details: {
            session_id: !!body.session_id,
            reference: !!body.reference,
            last_reference: !!body.last_reference,
            amount: body.amount,
          },
        },
        { status: 400 }
      );
    }

    const credentials = validateECRCredentials();
    const terminalUrl = body.terminal_url || credentials.terminalUrl;
    const terminalId = body.terminal_id || credentials.terminalId;

    // Generate ECR amounts object with full tax breakdown from rate
    const amounts = generateECRAmounts(body.amount);

    console.log('ATH Móvil Sale - Amounts breakdown:', amounts);

    const requestBody: Record<string, unknown> = {
      terminal_id: terminalId,
      terminal_url: terminalUrl,
      station_number: credentials.stationNumber,
      cashier_id: credentials.cashierId,
      reference: body.reference,
      last_reference: body.last_reference,
      receipt_email: 'yes',
      amounts,
      receipt_output: 'BOTH',
      manual_entry_indicator: 'no',
      session_id: body.session_id,
      process_cashback: 'no',
    };

    if (body.force_duplicate === 'yes') {
      requestBody.force_duplicate = 'yes';
      console.log('ATH Móvil Sale — force_duplicate enabled');
    }

    console.log('ATH Móvil Sale - Middleware request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/sales/start-ath-movil-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ATH Móvil Sale failed:', errorText);

      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ATH_MOVIL_SALE_FAILED',
          message: 'Failed to initiate ATH Móvil payment',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRSaleResponse = await response.json();

    console.log('ATH Móvil Sale - Middleware response:', JSON.stringify(data, null, 2));

    // Detect DUPLICATED TRANSACTION
    const responseMsg = (data.response_message || '').toUpperCase();
    if (!data.trx_id && responseMsg.includes('DUPLICAT')) {
      console.warn('ATH Móvil Sale — DUPLICATE TRANSACTION detected');
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'DUPLICATE_TRANSACTION',
          message: data.response_message || 'Duplicated transaction detected by terminal',
          details: {
            approval_code: data.approval_code,
            response_message: data.response_message,
            reference: data.reference || body.reference,
            last_reference: data.last_reference || body.last_reference,
            session_id: data.session_id || body.session_id,
          },
        },
        { status: 409 }
      );
    }

    if (!data.trx_id) {
      console.error('ATH Móvil Sale - Missing trx_id in response');
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'SALE_REJECTED',
          message: data.message || 'ATH Móvil sale rejected — no transaction ID',
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ECRSaleResponse>(
      {
        success: true,
        trx_id: data.trx_id,
        reference: data.reference || body.reference,
        amount: amounts.total,
        approval_code: data.approval_code,
        response_message: data.response_message,
        session_id: data.session_id,
        status: 'pending',
        message: data.message || 'ATH Móvil payment initiated — waiting for customer',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ATH Móvil Sale error:', error);

    return NextResponse.json<ECRError>(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
