import { NextResponse } from "next/server"

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || "Internal server error"
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      error: "Internal server error"
    },
    { status: 500 }
  )
}

