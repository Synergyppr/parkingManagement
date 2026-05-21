/**
 * ECR Terminal Get Transaction Status API Route
 * POST /api/payments/ecr/transaction/get-status
 *
 * Polls the status of an ongoing ECR transaction.
 * Call every ~1 second until approval_code is "00" (approved) or "ZY" (declined).
 * "ST" means still processing — keep polling.
 *
 * terminal_url and terminal_id are read from env vars and can be optionally overridden.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRStatusResponse, ECRError } from '@/app/types/ecr';

interface GetStatusRequestBody {
  session_id: string;
  trx_id: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_URL */
  terminal_url?: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_ID */
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GetStatusRequestBody = await request.json();

    if (!body.session_id || !body.trx_id) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: session_id, trx_id',
        },
        { status: 400 }
      );
    }

    const credentials = validateECRCredentials();
    const terminalUrl = body.terminal_url || credentials.terminalUrl;
    const terminalId = body.terminal_id || credentials.terminalId;

    const requestBody = {
      session_id: body.session_id,
      terminal_id: terminalId,
      terminal_url: terminalUrl,
      station_number: credentials.stationNumber,
      cashier_id: credentials.cashierId,
      trx_id: body.trx_id,
    };

    console.log('ECR Get Status — request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/transaction/get-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Get Status failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_STATUS_CHECK_FAILED',
          message: 'Failed to get transaction status',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRStatusResponse = await response.json();

    console.log('ECR Get Status — approval_code:', data.approval_code, '| message:', data.response_message);

    return NextResponse.json<ECRStatusResponse>(data, { status: 200 });
  } catch (error) {
    console.error('ECR Get Status error:', error);
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
