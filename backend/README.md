# Drawing App Backend

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Endpoints

- `POST /drawings` - Create a new drawing
- `GET /drawings` - Get all drawings
- `GET /drawings/{id}` - Get a specific drawing
- `PUT /drawings/{id}` - Update a drawing
- `DELETE /drawings/{id}` - Delete a drawing