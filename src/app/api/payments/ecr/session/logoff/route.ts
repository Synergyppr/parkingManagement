/**
 * ECR Terminal Logoff API Route
 * POST /api/payments/ecr/session/logoff
 *
 * Ends the terminal session. Should be called after all transactions are complete.
 *
 * terminal_url and terminal_id are read from env vars and can be optionally overridden.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRLogoffResponse, ECRError } from '@/app/types/ecr';

interface LogoffRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_URL */
  terminal_url?: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_ID */
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogoffRequestBody = await request.json();

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

    console.log('ECR Logoff — ending session:', body.session_id);

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/session/logoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        terminal_id: terminalId,
        terminal_url: terminalUrl,
        station_number: credentials.stationNumber,
        cashier_id: credentials.cashierId,
        session_id: body.session_id,
        reference: body.reference,
        last_reference: body.last_reference,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Logoff failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_LOGOFF_FAILED',
          message: 'Failed to end terminal session',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRLogoffResponse = await response.json();
    console.log('ECR Logoff — response:', JSON.stringify(data, null, 2));

    return NextResponse.json<ECRLogoffResponse>(
      {
        success: true,
        message: data.message || 'Terminal session ended successfully',
        reference: data.reference,
        approval_code: data.approval_code,
        response_message: data.response_message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Logoff error:', error);
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
