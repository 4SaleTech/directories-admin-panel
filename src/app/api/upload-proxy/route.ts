import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route to bypass CORS restrictions when uploading to S3
 * This routes requests through our Next.js server to avoid browser CORS issues
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the presigned URL from query parameters
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing presigned URL' },
        { status: 400 }
      );
    }

    // Get the file data from the request body
    const fileData = await request.arrayBuffer();

    // Get content type from headers
    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    // Forward the upload to S3
    const response = await fetch(url, {
      method: 'PUT',
      body: fileData,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Upload Proxy] S3 error:', errorText);
      return NextResponse.json(
        { error: `S3 upload failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Upload Proxy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
