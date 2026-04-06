import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://192.168.222.146:8000/api/v1/rpc/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: -32000, message } },
      { status: 500 }
    );
  }
}
