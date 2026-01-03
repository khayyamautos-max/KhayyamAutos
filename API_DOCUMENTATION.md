# Bike Parts System - API Documentation

## Overview

This document describes the complete REST API backend for the Bike Parts System. All endpoints require authentication via Supabase.

## Base URL

All API endpoints are prefixed with `/api`

## Authentication

All endpoints require a valid Supabase authentication token. The token should be included in the request headers (handled automatically by Supabase client).

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": {} // Optional additional details
}
```

## Endpoints

### Inventory Management

#### GET /api/inventory
Get all inventory items with optional filters.

**Query Parameters:**
- `search` (string): Search by part name or part number
- `category` (string): Filter by category
- `lowStock` (boolean): Filter items with low stock
- `companyId` (string): Filter by company ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "part_number": "SH-105-RD",
      "name": "Shimano 105 Rear Derailleur",
      "description": "...",
      "company_id": "uuid",
      "category": "Drivetrain",
      "cost_price": 45.00,
      "selling_price": 75.00,
      "quantity_in_stock": 20,
      "min_stock_level": 5,
      "companies": {
        "name": "Shimano",
        "id": "uuid"
      }
    }
  ]
}
```

#### GET /api/inventory/[id]
Get a single inventory item by ID.

#### POST /api/inventory
Create a new inventory item (Admin/Owner only).

**Request Body:**
```json
{
  "part_number": "SH-105-RD",
  "name": "Shimano 105 Rear Derailleur",
  "description": "Optional description",
  "company_id": "uuid (optional)",
  "category": "Drivetrain",
  "cost_price": 45.00,
  "selling_price": 75.00,
  "quantity_in_stock": 20,
  "min_stock_level": 5
}
```

#### PUT /api/inventory/[id]
Update an inventory item (Admin/Owner only).

**Request Body:** (All fields optional)
```json
{
  "name": "Updated name",
  "selling_price": 80.00,
  "quantity_in_stock": 25
}
```

#### DELETE /api/inventory/[id]
Delete an inventory item (Admin/Owner only).

---

### Customer Management

#### GET /api/customers
Get all customers with optional filters.

**Query Parameters:**
- `search` (string): Search by name or phone
- `hasDebt` (boolean): Filter customers with debt

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+1234567890",
      "address": "123 Main St",
      "debt_balance": 150.00,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/customers/[id]
Get a single customer by ID.

#### POST /api/customers
Create a new customer.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "debt_balance": 0.00
}
```

#### PUT /api/customers/[id]
Update a customer.

#### DELETE /api/customers/[id]
Delete a customer.

#### POST /api/customers/[id]/debt
Settle or add customer debt.

**Request Body:**
```json
{
  "amount": 50.00,
  "action": "settle" // or "add"
}
```

**Response:**
```json
{
  "data": { /* updated customer */ },
  "message": "Debt settled successfully",
  "previous_balance": 150.00,
  "new_balance": 100.00
}
```

---

### Company Management

#### GET /api/companies
Get all companies.

**Query Parameters:**
- `search` (string): Search by company name

#### GET /api/companies/[id]
Get a single company by ID.

#### POST /api/companies
Create a new company (Admin/Owner only).

**Request Body:**
```json
{
  "name": "Shimano",
  "description": "Global leader in bicycle components",
  "contact_info": {
    "phone": "+1234567890",
    "email": "contact@shimano.com"
  }
}
```

#### PUT /api/companies/[id]
Update a company (Admin/Owner only).

#### DELETE /api/companies/[id]
Delete a company (Admin/Owner only).

---

### Transaction Management

#### GET /api/transactions
Get all transactions with optional filters.

**Query Parameters:**
- `customerId` (string): Filter by customer ID
- `status` (string): Filter by status (completed, pending_debt)
- `paymentMethod` (string): Filter by payment method
- `startDate` (string): Filter from date (ISO format)
- `endDate` (string): Filter to date (ISO format)
- `limit` (number): Limit results (default: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "staff_id": "uuid",
      "total_amount": 150.00,
      "payment_method": "cash",
      "status": "completed",
      "items": [
        {
          "id": "uuid",
          "name": "Shimano 105 Rear Derailleur",
          "quantity": 2,
          "price": 75.00
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "customers": {
        "name": "John Doe",
        "id": "uuid"
      },
      "profiles": {
        "full_name": "Staff Member",
        "email": "staff@example.com"
      }
    }
  ]
}
```

#### GET /api/transactions/[id]
Get a single transaction by ID.

#### POST /api/transactions
Create a new transaction (usually done through POS checkout).

**Request Body:**
```json
{
  "customer_id": "uuid (optional)",
  "total_amount": 150.00,
  "payment_method": "cash",
  "status": "completed",
  "items": [
    {
      "id": "uuid",
      "name": "Shimano 105 Rear Derailleur",
      "quantity": 2,
      "price": 75.00
    }
  ]
}
```

---

### POS Checkout

#### POST /api/pos/checkout
Complete a POS checkout with atomic inventory updates.

This endpoint:
1. Validates stock availability
2. Creates a transaction
3. Updates inventory quantities
4. Updates customer debt if payment method is "debt"

**Request Body:**
```json
{
  "customer_id": "uuid (optional)",
  "items": [
    {
      "id": "uuid",
      "quantity": 2,
      "price": 75.00
    }
  ],
  "payment_method": "cash", // cash, card, or debt
  "tax_rate": 0.08 // Optional, default 0.08 (8%)
}
```

**Response:**
```json
{
  "data": { /* transaction object */ },
  "message": "Checkout completed successfully",
  "totals": {
    "subtotal": 150.00,
    "tax": 12.00,
    "total": 162.00
  }
}
```

**Error Responses:**
- `400`: Invalid request (missing items, insufficient stock, etc.)
- `401`: Unauthorized
- `500`: Server error

---

### Search

#### GET /api/search
Search across multiple entities.

**Query Parameters:**
- `q` (string, required): Search query
- `types` (string, comma-separated): Entity types to search (inventory, customers, companies). Default: all

**Response:**
```json
{
  "data": {
    "inventory": [ /* inventory items */ ],
    "customers": [ /* customers */ ],
    "companies": [ /* companies */ ]
  },
  "query": "search term"
}
```

---

### Statistics

#### GET /api/stats
Get dashboard statistics and metrics.

**Query Parameters:**
- `period` (string): Time period (all, today, week, month). Default: all

**Response:**
```json
{
  "data": {
    "inventory": {
      "totalParts": 150,
      "lowStockCount": 5
    },
    "customers": {
      "total": 50,
      "totalDebt": 1250.00,
      "debtorsCount": 12
    },
    "sales": {
      "totalSales": 50000.00,
      "todaySales": 500.00,
      "transactionCount": 250,
      "avgTransactionValue": 200.00
    },
    "period": "all"
  }
}
```

---

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (Admin access required)
- `404`: Not Found
- `500`: Internal Server Error

## Role-Based Access Control

- **All authenticated users** can:
  - View inventory, customers, companies, transactions
  - Create customers and transactions
  - Search across entities

- **Admin/Owner only** can:
  - Create, update, delete inventory items
  - Create, update, delete companies

## Notes

1. All monetary values are in decimal format (e.g., 75.00)
2. All dates are in ISO 8601 format
3. Inventory updates are atomic (handled via database functions)
4. POS checkout ensures stock availability before processing
5. Customer debt is automatically updated when payment method is "debt"

