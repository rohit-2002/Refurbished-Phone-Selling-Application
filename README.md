# Phone Inventory Management System

A full-stack web application for managing phone inventory with multi-platform listing capabilities. Built with Flask (Python) backend and React frontend.

## Features

- **Phone Inventory Management**: Add, edit, delete, and view phone records
- **Search & Filtering**: Search by brand, model, or condition
- **Bulk CSV Import**: Upload multiple phone records at once
- **Multi-Platform Listing**: Simulate listings on platforms X, Y, and Z
- **Dynamic Pricing**: Platform-specific pricing with manual overrides
- **Stock Tracking**: Monitor inventory levels and discontinued items
- **Admin Controls**: Secure admin-only operations

## Tech Stack

**Backend:** Flask, SQLAlchemy, SQLite  
**Frontend:** React, Tailwind CSS, Vite

## Project Structure

```
phone-inventory/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── forms.py            # Form definitions
│   ├── utils.py            # Utility functions
│   ├── pricing.py          # Pricing logic
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main React app
│   └── package.json        # Node.js dependencies
└── sample_phones.csv       # Sample data
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. **Backend**: `http://localhost:5000`
2. **Frontend**: `http://localhost:5173`
3. **Admin Access**: Add `?admin=1` to URLs
4. **Sample Data**: Import `sample_phones.csv` via bulk upload

## API Endpoints

### Public

- `GET /api/phones` - Get all phones
- `GET /api/phones/{id}` - Get specific phone

### Admin (require `?admin=1`)

- `POST /api/phones` - Create phone
- `PUT /api/phones/{id}` - Update phone
- `DELETE /api/phones/{id}` - Delete phone
- `POST /api/bulk_upload` - Bulk import from CSV
- `POST /list/{id}/{platform}` - List phone on platform

## Database Schema

### Phone Model

- id, brand, model_name, condition, storage, color
- base_price, stock_quantity, discontinued, tags
- manual_overrides (JSON), created_at, updated_at

### ListingLog Model

- id, phone_id, platform, success, message
- attempted_price, fee, created_at
