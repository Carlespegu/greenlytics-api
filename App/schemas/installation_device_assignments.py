from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InstallationDeviceAssignmentsSummaryResponse(BaseModel):
    installation_id: UUID
    installation_name: str
    client_id: UUID
    client_name: Optional[str] = None
    notes: Optional[str] = None
    selected_device_ids: List[UUID] = Field(default_factory=list)


class InstallationDeviceAssignmentsSyncRequest(BaseModel):
    client_id: Optional[UUID] = None
    notes: Optional[str] = None
    device_ids: List[UUID] = Field(default_factory=list)


class InstallationDeviceAssignmentsSyncResponse(BaseModel):
    installation_id: UUID
    client_id: UUID
    assigned_count: int
    selected_device_ids: List[UUID] = Field(default_factory=list)
