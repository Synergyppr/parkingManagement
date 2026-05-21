/**
 * ECR Terminal Journal API Route
 * POST /api/payments/ecr/journal
 *
 * Retrieves transaction information from the current (unsettled) batch.
 *
 * Two modes:
 *   - target_reference = "all" → returns all transactions grouped by payment host,
 *     paginated 100 at a time (use `start` for offset).
 *   - target_reference = "<ref>" → returns a single transaction's full details.
 *
 * terminal_url and terminal_id are read from env vars and can be optionally overridden.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRJournalResponse, ECRError } from '@/app/types/ecr';

interface JournalRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  /** "all" for all transactions, or a specific reference number */
  target_reference: string;
  /** Pagination offset when target_reference is "all" (returns 100 from this position) */
  start?: number;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_URL */
  terminal_url?: string;
  /** Optional — overrides EVERTEC_ECR_TERMINAL_ID */
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JournalRequestBody = await request.json();

    if (!body.session_id || !body.reference || !body.last_reference || !body.target_reference) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: session_id, reference, last_reference, target_reference',
        },
        { status: 400 }
      );
    }

    const credentials = validateECRCredentials();
    const terminalUrl = body.terminal_url || credentials.terminalUrl;
    const terminalId = body.terminal_id || credentials.terminalId;

    const requestBody: Record<string, unknown> = {
      terminal_id: terminalId,
      terminal_url: terminalUrl,
      station_number: credentials.stationNumber,
      cashier_id: credentials.cashierId,
      session_id: body.session_id,
      reference: body.reference,
      last_reference: body.last_reference,
      target_reference: body.target_reference,
    };

    if (body.start !== undefined && body.target_reference === 'all') {
      requestBody.start = body.start;
    }

    console.log('ECR Journal — middleware request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Journal failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_JOURNAL_FAILED',
          message: 'Failed to retrieve journal data',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRJournalResponse = await response.json();
    console.log('ECR Journal — approval_code:', data.approval_code, '| target:', body.target_reference);

    if (data.approval_code && data.approval_code !== '00') {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'JOURNAL_REJECTED',
          message: data.response_message || 'Journal request was rejected by the terminal',
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ECRJournalResponse>(
      {
        success: true,
        reference: data.reference,
        last_reference: data.last_reference,
        session_id: data.session_id,
        terminal_id: data.terminal_id,
        merchant_id: data.merchant_id,
        approval_code: data.approval_code,
        response_message: data.response_message,
        target_reference: data.target_reference || body.target_reference,
        reference_value: data.reference_value,
        total_transactions: data.total_transactions,
        start: data.start,
        message: data.message || 'Journal data retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Journal error:', error);
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
