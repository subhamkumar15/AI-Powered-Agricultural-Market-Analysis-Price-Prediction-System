import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.services.seed_service import seed_database

# Routers
from app.api.auth import router as auth_router
from app.api.commodities import router as commodities_router
from app.api.markets import router as markets_router
from app.api.prices import router as prices_router
from app.api.weather import router as weather_router
from app.api.predictions import router as predictions_router
from app.api.calculators import router as calculators_router
from app.api.arbitrage import router as arbitrage_router
from app.api.msp import router as msp_router
from app.api.supply_demand import router as supply_demand_router
from app.api.risks import router as risks_router
from app.api.alerts import router as alerts_router
from app.api.assistant import router as assistant_router
from app.api.reports import router as reports_router
from app.api.overview import router as overview_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agrimarket")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Run database seed
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
    
    yield
    logger.info("Shutting down AgriMarket API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI-Powered Agricultural Market Price Analysis, Prediction & Decision Support System",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(commodities_router, prefix=settings.API_V1_STR)
app.include_router(markets_router, prefix=settings.API_V1_STR)
app.include_router(prices_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(calculators_router, prefix=settings.API_V1_STR)
app.include_router(arbitrage_router, prefix=settings.API_V1_STR)
app.include_router(msp_router, prefix=settings.API_V1_STR)
app.include_router(supply_demand_router, prefix=settings.API_V1_STR)
app.include_router(risks_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(overview_router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AgriMarket Intelligence API",
        "version": settings.VERSION,
        "database": str(engine.url)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
