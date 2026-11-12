from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, Any

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    module: str = "system" # system, ps1, ps2, ps3
    student_id: Optional[str] = None
    data: Optional[T] = None
    message: str = "Operation completed"

    class Config:
        arbitrary_types_allowed = True

