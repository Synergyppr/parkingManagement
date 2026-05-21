/**
 * ECR Terminal Logon API Route
 * POST /api/payments/ecr/session/logon
 *
 * Establishes a session with the ECR terminal.
 * Returns session_id for use in all subsequent calls.
 *
 * terminal_url and terminal_id are read from env vars (EVERTEC_ECR_TERMINAL_URL /
 * EVERTEC_ECR_TERMINAL_ID) and can be optionally overridden per-request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRLogonResponse, ECRError } from '@/app/types/ecr';

interface LogonRequestBody {
  reference: string;
  last_reference: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_URL */
  terminal_url?: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_ID */
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogonRequestBody = await request.json();

    if (!body.reference || !body.last_reference) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: reference, last_reference',
        },
        { status: 400 }
      );
    }

    const credentials = validateECRCredentials();
    const terminalUrl = body.terminal_url || credentials.terminalUrl;
    const terminalId = body.terminal_id || credentials.terminalId;

    console.log('ECR Logon - terminal_url:', terminalUrl);
    console.log('ECR Logon - terminal_id:', terminalId);
    console.log('ECR Logon - reference:', body.reference, '| last_reference:', body.last_reference);

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/session/logon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        terminal_id: terminalId,
        terminal_url: terminalUrl,
        station_number: credentials.stationNumber,
        cashier_id: credentials.cashierId,
        reference: body.reference,
        last_reference: body.last_reference,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Logon failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_LOGON_FAILED',
          message: 'Failed to establish terminal session',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRLogonResponse = await response.json();
    console.log('ECR Logon - Full response:', JSON.stringify(data, null, 2));

    // approval_code "00" = success, "ZY" = error
    if (data.approval_code && data.approval_code !== '00') {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_LOGON_REJECTED',
          message: data.response_message || 'Terminal logon rejected',
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    if (!data.session_id) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_SESSION',
          message: 'Invalid session response — missing session_id',
          details: data as unknown as Record<string, unknown>,
        },
        { status: 500 }
      );
    }

    console.log('ECR Logon successful — session_id:', data.session_id);

    return NextResponse.json<ECRLogonResponse>(
      {
        success: true,
        session_id: data.session_id,
        terminal_id: data.terminal_id || terminalId,
        reference: data.reference || body.reference,
        last_reference: data.last_reference,
        merchant_id: data.merchant_id,
        approval_code: data.approval_code,
        response_message: data.response_message,
        message: 'Terminal session established successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Logon error:', error);
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
