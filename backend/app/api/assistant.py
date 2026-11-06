from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import AssistantQueryRequest, AssistantQueryResponse
from app.services.assistant_service import ai_assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Market Intelligence Assistant"])

@router.post("/chat", response_model=AssistantQueryResponse)
def chat_with_assistant(
    req: AssistantQueryRequest,
    db: Session = Depends(get_db)
):
    return ai_assistant_service.answer_query(
        db=db,
        query_text=req.question,
        context_comm=req.context_commodity,
        context_state=req.context_state
    )
