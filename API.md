# API Documentation

## Base URL

Development: `http://localhost:3001/api`

## Endpoints

### Settings

#### Get Setting
```
GET /api/settings/:key
```

**Response:**
```json
{
  "value": "string or null"
}
```

#### Save Setting
```
POST /api/settings
```

**Request Body:**
```json
{
  "key": "string",
  "value": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### AI Tattoo Generator

#### Generate Tattoo Design
```
POST /api/generate-tattoo
```

**Request Body:**
```json
{
  "prompt": "A phoenix rising from flames in Japanese style",
  "apiKey": "your-gemini-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "description": "Detailed tattoo design description...",
  "id": 1
}
```

#### Get Generated Tattoos History
```
GET /api/generated-tattoos
```

**Response:**
```json
[
  {
    "id": 1,
    "prompt": "A phoenix rising from flames",
    "description": "Detailed design description...",
    "customer_id": null,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

---

### Customers

#### Get All Customers
```
GET /api/customers
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "notes": "Customer notes",
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### Get Single Customer
```
GET /api/customers/:id
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "notes": "Customer notes",
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### Create Customer
```
POST /api/customers
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "notes": "Customer notes"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

#### Update Customer
```
PUT /api/customers/:id
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Delete Customer
```
DELETE /api/customers/:id
```

**Response:**
```json
{
  "success": true
}
```

---

### Appointments

#### Get All Appointments
```
GET /api/appointments
```

**Response:**
```json
[
  {
    "id": 1,
    "customer_id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "artist_name": "Jane Artist",
    "appointment_date": "2024-01-15T14:00:00Z",
    "duration": 120,
    "status": "scheduled",
    "notes": "Sleeve tattoo",
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### Create Appointment
```
POST /api/appointments
```

**Request Body:**
```json
{
  "customer_id": 1,
  "artist_name": "Jane Artist",
  "appointment_date": "2024-01-15T14:00:00",
  "duration": 120,
  "notes": "Sleeve tattoo"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

#### Update Appointment
```
PUT /api/appointments/:id
```

**Request Body:**
```json
{
  "artist_name": "Jane Artist",
  "appointment_date": "2024-01-15T14:00:00",
  "duration": 120,
  "status": "completed",
  "notes": "Completed successfully"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Delete Appointment
```
DELETE /api/appointments/:id
```

**Response:**
```json
{
  "success": true
}
```

---

### Pricelist

#### Get All Services
```
GET /api/pricelist
```

**Response:**
```json
[
  {
    "id": 1,
    "service_name": "Small Tattoo",
    "description": "Up to 2 inches",
    "price": 100.00,
    "duration": 60,
    "category": "Small Tattoos"
  }
]
```

#### Create Service
```
POST /api/pricelist
```

**Request Body:**
```json
{
  "service_name": "Small Tattoo",
  "description": "Up to 2 inches",
  "price": 100.00,
  "duration": 60,
  "category": "Small Tattoos"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

#### Update Service
```
PUT /api/pricelist/:id
```

**Request Body:**
```json
{
  "service_name": "Small Tattoo",
  "description": "Up to 2 inches",
  "price": 120.00,
  "duration": 60,
  "category": "Small Tattoos"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Delete Service
```
DELETE /api/pricelist/:id
```

**Response:**
```json
{
  "success": true
}
```

---

### Portfolio

#### Get All Portfolio Items
```
GET /api/portfolio
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Dragon Sleeve",
    "description": "Full sleeve dragon tattoo",
    "image_url": "https://example.com/image.jpg",
    "artist_name": "Jane Artist",
    "tags": "dragon, sleeve, color",
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### Create Portfolio Item
```
POST /api/portfolio
```

**Request Body:**
```json
{
  "title": "Dragon Sleeve",
  "description": "Full sleeve dragon tattoo",
  "image_url": "https://example.com/image.jpg",
  "artist_name": "Jane Artist",
  "tags": "dragon, sleeve, color"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

#### Delete Portfolio Item
```
DELETE /api/portfolio/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

## Database Schema

### customers
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT NOT NULL
- `email`: TEXT UNIQUE NOT NULL
- `phone`: TEXT
- `address`: TEXT
- `notes`: TEXT
- `created_at`: DATETIME

### appointments
- `id`: INTEGER PRIMARY KEY
- `customer_id`: INTEGER (FK to customers)
- `artist_name`: TEXT NOT NULL
- `appointment_date`: DATETIME NOT NULL
- `duration`: INTEGER NOT NULL
- `status`: TEXT (scheduled/completed/cancelled)
- `notes`: TEXT
- `created_at`: DATETIME

### pricelist
- `id`: INTEGER PRIMARY KEY
- `service_name`: TEXT NOT NULL
- `description`: TEXT
- `price`: REAL NOT NULL
- `duration`: INTEGER
- `category`: TEXT

### portfolio
- `id`: INTEGER PRIMARY KEY
- `title`: TEXT NOT NULL
- `description`: TEXT
- `image_url`: TEXT NOT NULL
- `artist_name`: TEXT
- `tags`: TEXT
- `created_at`: DATETIME

### settings
- `key`: TEXT PRIMARY KEY
- `value`: TEXT NOT NULL

### generated_tattoos
- `id`: INTEGER PRIMARY KEY
- `prompt`: TEXT NOT NULL
- `description`: TEXT
- `customer_id`: INTEGER (FK to customers)
- `created_at`: DATETIME
