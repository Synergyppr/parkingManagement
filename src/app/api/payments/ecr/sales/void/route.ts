/**
 * ECR Terminal Void API Route
 * POST /api/payments/ecr/sales/void
 *
 * Voids (cancels) a previous transaction within the same batch.
 * Void is immediate — no polling required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRVoidResponse, ECRError } from '@/app/types/ecr';

interface VoidRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  /** Reference of the transaction to void */
  target_reference: string;
  terminal_url?: string;
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VoidRequestBody = await request.json();

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

    const requestBody = {
      terminal_id: terminalId,
      terminal_url: terminalUrl,
      station_number: credentials.stationNumber,
      cashier_id: credentials.cashierId,
      session_id: body.session_id,
      reference: body.reference,
      last_reference: body.last_reference,
      target_reference: body.target_reference,
      receipt_output: 'BOTH',
      receipt_email: 'yes',
    };

    console.log('ECR Void — middleware request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/sales/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Void failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_VOID_FAILED',
          message: 'Failed to void transaction',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRVoidResponse = await response.json();
    console.log('ECR Void — response:', JSON.stringify(data, null, 2));

    if (data.approval_code && data.approval_code !== '00') {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'VOID_REJECTED',
          message: data.response_message || 'Void was rejected by the terminal',
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ECRVoidResponse>(
      {
        success: true,
        trx_id: data.trx_id,
        reference: data.reference,
        target_reference: data.target_reference || body.target_reference,
        approval_code: data.approval_code,
        response_message: data.response_message,
        message: data.message || 'Transaction voided successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Void error:', error);
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
