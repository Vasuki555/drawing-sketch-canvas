from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import json
import base64
import uuid
from datetime import datetime
import os

# Initialize FastAPI app
app = FastAPI(title="Drawing App API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React Native app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_PATH = "drawings.db"

def init_db():
    """Initialize the SQLite database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drawings (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            preview_image TEXT NOT NULL,
            canvas_state TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class DrawingCreate(BaseModel):
    name: str
    preview_image: str  # Base64 encoded image
    canvas_state: dict  # Full canvas JSON state

class DrawingUpdate(BaseModel):
    name: Optional[str] = None
    preview_image: Optional[str] = None
    canvas_state: Optional[dict] = None

class DrawingResponse(BaseModel):
    id: str
    name: str
    preview_image: str
    canvas_state: dict
    created_at: str
    updated_at: str

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Drawing App API is running"}

@app.post("/drawings", response_model=DrawingResponse)
async def create_drawing(drawing: DrawingCreate):
    """Create a new drawing"""
    try:
        drawing_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO drawings (id, name, preview_image, canvas_state, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            drawing_id,
            drawing.name,
            drawing.preview_image,
            json.dumps(drawing.canvas_state),
            current_time,
            current_time
        ))
        
        conn.commit()
        conn.close()
        
        return DrawingResponse(
            id=drawing_id,
            name=drawing.name,
            preview_image=drawing.preview_image,
            canvas_state=drawing.canvas_state,
            created_at=current_time,
            updated_at=current_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create drawing: {str(e)}")

@app.get("/drawings", response_model=List[DrawingResponse])
async def get_drawings():
    """Get all drawings"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, preview_image, canvas_state, created_at, updated_at
            FROM drawings
            ORDER BY updated_at DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        drawings = []
        for row in rows:
            drawings.append(DrawingResponse(
                id=row[0],
                name=row[1],
                preview_image=row[2],
                canvas_state=json.loads(row[3]),
                created_at=row[4],
                updated_at=row[5]
            ))
        
        return drawings
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get drawings: {str(e)}")

@app.get("/drawings/{drawing_id}", response_model=DrawingResponse)
async def get_drawing(drawing_id: str):
    """Get a specific drawing by ID"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, preview_image, canvas_state, created_at, updated_at
            FROM drawings
            WHERE id = ?
        """, (drawing_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Drawing not found")
        
        return DrawingResponse(
            id=row[0],
            name=row[1],
            preview_image=row[2],
            canvas_state=json.loads(row[3]),
            created_at=row[4],
            updated_at=row[5]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get drawing: {str(e)}")

@app.put("/drawings/{drawing_id}", response_model=DrawingResponse)
async def update_drawing(drawing_id: str, drawing: DrawingUpdate):
    """Update an existing drawing"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if drawing exists
        cursor.execute("SELECT id FROM drawings WHERE id = ?", (drawing_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Drawing not found")
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if drawing.name is not None:
            update_fields.append("name = ?")
            update_values.append(drawing.name)
        
        if drawing.preview_image is not None:
            update_fields.append("preview_image = ?")
            update_values.append(drawing.preview_image)
        
        if drawing.canvas_state is not None:
            update_fields.append("canvas_state = ?")
            update_values.append(json.dumps(drawing.canvas_state))
        
        if not update_fields:
            conn.close()
            raise HTTPException(status_code=400, detail="No fields to update")
        
        current_time = datetime.now().isoformat()
        update_fields.append("updated_at = ?")
        update_values.append(current_time)
        update_values.append(drawing_id)
        
        cursor.execute(f"""
            UPDATE drawings 
            SET {', '.join(update_fields)}
            WHERE id = ?
        """, update_values)
        
        # Get updated drawing
        cursor.execute("""
            SELECT id, name, preview_image, canvas_state, created_at, updated_at
            FROM drawings
            WHERE id = ?
        """, (drawing_id,))
        
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        
        return DrawingResponse(
            id=row[0],
            name=row[1],
            preview_image=row[2],
            canvas_state=json.loads(row[3]),
            created_at=row[4],
            updated_at=row[5]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update drawing: {str(e)}")

@app.delete("/drawings/{drawing_id}")
async def delete_drawing(drawing_id: str):
    """Delete a drawing"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM drawings WHERE id = ?", (drawing_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Drawing not found")
        
        conn.commit()
        conn.close()
        
        return {"message": "Drawing deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete drawing: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)