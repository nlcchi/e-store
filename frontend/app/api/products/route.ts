import { NextRequest, NextResponse } from 'next/server';
import { environment } from '@/config/environment';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// Helper function to handle CORS
function corsResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());

    const apiUrl = new URL(`${environment.API_BASE_URL}${API_ENDPOINTS.PRODUCTS.LIST}`);
    // Add filters as query parameters
    Object.entries(filters).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });

    const headersList = headers();
    const authHeader = headersList.get('Authorization');

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return corsResponse(new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return corsResponse(new NextResponse(
      JSON.stringify({ error: 'Failed to fetch products' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = `${environment.API_BASE_URL}${API_ENDPOINTS.PRODUCTS.CREATE}`;
    
    const headersList = headers();
    const authHeader = headersList.get('Authorization');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return corsResponse(new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    console.error('Error in products POST:', error);
    return corsResponse(new NextResponse(
      JSON.stringify({ error: 'Failed to process product request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ));
  }
}
