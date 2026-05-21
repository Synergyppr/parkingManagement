/**
 * ECR Terminal Tip Adjust API Route
 * POST /api/payments/ecr/sales/tip-adjust
 *
 * Adjusts the tip amount on a previously approved transaction.
 * Tip adjust is immediate — no polling required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { ECRTipAdjustResponse, ECRError } from '@/app/types/ecr';

interface TipAdjustRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  /** Reference of the transaction to adjust */
  target_reference: string;
  /** New tip amount as decimal string e.g. "5.00" */
  tip: string;
  terminal_url?: string;
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TipAdjustRequestBody = await request.json();

    if (
      !body.session_id ||
      !body.reference ||
      !body.last_reference ||
      !body.target_reference ||
      body.tip === undefined
    ) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: session_id, reference, last_reference, target_reference, tip',
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
      tip: body.tip,
    };

    console.log('ECR Tip Adjust — middleware request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/sales/tip-adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Tip Adjust failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_TIP_ADJUST_FAILED',
          message: 'Failed to adjust tip',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRTipAdjustResponse = await response.json();
    console.log('ECR Tip Adjust — response:', JSON.stringify(data, null, 2));

    if (data.approval_code && data.approval_code !== '00') {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'TIP_ADJUST_REJECTED',
          message: data.response_message || 'Tip adjustment was rejected by the terminal',
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ECRTipAdjustResponse>(
      {
        success: true,
        reference: data.reference,
        target_reference: data.target_reference || body.target_reference,
        tip: data.tip || body.tip,
        approval_code: data.approval_code,
        response_message: data.response_message,
        message: data.message || 'Tip adjusted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Tip Adjust error:', error);
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
