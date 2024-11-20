import { NextResponse } from 'next/server';
import { environment } from '@/config/environment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());

    const apiUrl = new URL(`${environment.API_BASE_URL}/products`);
    // Add filters as query parameters
    Object.entries(filters).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const products = await response.json();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
