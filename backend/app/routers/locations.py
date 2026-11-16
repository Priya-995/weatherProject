from fastapi import APIRouter, HTTPException, Query
from app.services.open_meteo import search_locations

router = APIRouter(prefix="/api/locations", tags=["locations"])


@router.get("/search")
async def locations_search(q: str = Query("")):
    try:
        results = await search_locations(q)
        return {"results": results}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
