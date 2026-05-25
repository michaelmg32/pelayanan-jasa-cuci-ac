import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/test-connection`);
    
    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Backend connection failed' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'success',
      message: 'Connected to backend API',
      backendResponse: data,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to backend API',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
