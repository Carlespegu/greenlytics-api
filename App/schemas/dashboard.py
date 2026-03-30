from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class DashboardKpi(BaseModel):
    title: str
    value: str
    subtitle: Optional[str] = None


class DashboardChartPoint(BaseModel):
    label: str
    soil_percent: Optional[float] = None
    ldr_raw: Optional[float] = None
    temp_c: Optional[float] = None


class DashboardRecentReading(BaseModel):
    plant: str
    type: str
    value: str
    device: str
    time: str


class DashboardPlantStatus(BaseModel):
    plant_id: Optional[UUID] = None
    name: str
    installation: str
    status: str
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    light: Optional[float] = None
    rain: Optional[str] = None
    rssi: Optional[int] = None
    last_reading: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    generated_at: datetime
    kpis: List[DashboardKpi]
    chart_data: List[DashboardChartPoint]
    latest_readings: List[DashboardRecentReading]
    plants: List[DashboardPlantStatus]
