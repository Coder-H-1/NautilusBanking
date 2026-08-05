"""
NAUTILUS Banking System — FastAPI Entry Point
Deployed on Render. Serves as the backend API server.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from models.schemas import HealthResponse
from middleware.rate_limit import limiter
from routers.bank_router import router as bank_router
from routers.acpi_router import router as acpi_router
from routers.qr_router import router as qr_router
from routers.auth_router import router as auth_router

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

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================
# CORS — Configured for Vercel and local development
# ============================================
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

default_origins = [
    "https://nautilusbanking.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

all_origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins if all_origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(bank_router)
app.include_router(acpi_router)
app.include_router(qr_router)
