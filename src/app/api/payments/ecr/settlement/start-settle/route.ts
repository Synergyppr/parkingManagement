/**
 * ECR Terminal Start Settlement API Route
 * POST /api/payments/ecr/settlement/start-settle
 *
 * Triggers end-of-day settlement (batch clearing with the payment host).
 * Returns trx_id — poll /ecr/transaction/get-status until approval_code is "00" or "ZY".
 * Must run at least once every 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRSettlementInitialResponse, ECRError } from '@/app/types/ecr';

interface StartSettleRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  /** "yes" to include details of the last settlement in the response */
  last_settle?: 'yes' | 'no';
  terminal_url?: string;
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StartSettleRequestBody = await request.json();

    if (!body.session_id || !body.reference || !body.last_reference) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: session_id, reference, last_reference',
        },
        { status: 400 }
      );
    }

    const credentials = validateECRCredentials();
    const terminalUrl = body.terminal_url || credentials.terminalUrl;
    const terminalId = body.terminal_id || credentials.terminalId;

    const requestBody = {
      terminal_id: terminalId,
      terminal_url: terminalUrl,
      station_number: credentials.stationNumber,
      cashier_id: credentials.cashierId,
      session_id: body.session_id,
      reference: body.reference,
      last_reference: body.last_reference,
      receipt_output: 'BOTH',
      last_settle: body.last_settle || 'no',
    };

    console.log('ECR Start Settle — middleware request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/settlement/start-settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Start Settle failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_SETTLEMENT_FAILED',
          message: 'Failed to initiate settlement',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRSettlementInitialResponse = await response.json();
    console.log('ECR Start Settle — response:', JSON.stringify(data, null, 2));

    if (!data.trx_id) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'SETTLEMENT_REJECTED',
          message: data.message || `Settlement rejected: ${data.response_message || 'no transaction ID'}`,
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ECRSettlementInitialResponse>(
      {
        success: true,
        trx_id: data.trx_id,
        reference: data.reference || body.reference,
        last_reference: data.last_reference,
        session_id: data.session_id,
        terminal_id: data.terminal_id || terminalId,
        approval_code: data.approval_code,
        response_message: data.response_message,
        receipt_output: data.receipt_output,
        message: data.message || 'Settlement initiated — poll get-status for completion',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Start Settle error:', error);
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
