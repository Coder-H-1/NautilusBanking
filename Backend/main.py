"""
NAUTILUS Banking System — FastAPI Entry Point
Deployed on Render. Serves as the backend API server.
"""

import os
import traceback
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from models.schemas import HealthResponse
from middleware.rate_limit import limiter
from routers.bank_router import router as bank_router
from routers.acpi_router import router as acpi_router
from routers.qr_router import router as qr_router
from routers.auth_router import router as auth_router
from routers.email_router import router as email_router
from routers.account_router import router as account_router
from middleware.deletion_scheduler import start_deletion_scheduler, stop_deletion_scheduler

# Load env vars
load_dotenv()

app = FastAPI(
    title="NAUTILUS Banking API",
    description="Backend API for the NAUTILUS Banking System — manages banks, transactions, encryption, and QR codes.",
    version="1.0.0",
    docs_url=None,       # Disable Swagger UI in production
    redoc_url=None,      # Disable ReDoc in production
    openapi_url=None,    # Disable OpenAPI schema in production
)

@app.on_event("startup")
async def on_startup():
    """Start background scheduler on app launch."""
    start_deletion_scheduler()

@app.on_event("shutdown")
async def on_shutdown():
    """Stop background scheduler on app shutdown."""
    stop_deletion_scheduler()

# Attach rate limiter
app.state.limiter = limiter

# ============================================
# CORS — Configured for Vercel, localhost, and all origins
# ============================================
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

default_origins = [
    "https://nautilusbanking.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

all_origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins if all_origins else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def get_cors_headers(request: Request) -> dict:
    """Returns CORS headers based on request origin."""
    origin = request.headers.get("origin") or "*"
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }


# ============================================
# Global Exception Handlers (Guarantees CORS headers on all errors)
# ============================================
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "detail": "Rate limit exceeded. Please slow down your requests.",
            "error": "Rate limit exceeded",
        },
        headers=get_cors_headers(request),
    )


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.detail,
            "error": str(exc.detail),
        },
        headers=get_cors_headers(request),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "detail": exc.errors(),
            "error": "Request validation error",
        },
        headers=get_cors_headers(request),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"[UNHANDLED EXCEPTION] {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": str(exc),
            "error": f"Internal Server Error: {str(exc)}",
        },
        headers=get_cors_headers(request),
    )


# ============================================
# Health Check
# ============================================
@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint — confirms API is running on Render."""
    return HealthResponse()


# ============================================
# Mount Routers
# ============================================
app.include_router(auth_router)
app.include_router(account_router)
app.include_router(bank_router)
app.include_router(acpi_router)
app.include_router(qr_router)
app.include_router(email_router)

