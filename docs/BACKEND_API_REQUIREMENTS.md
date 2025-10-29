# Backend API Requirements for Mobile App

This document outlines the API endpoints needed to complete mobile app functionality.

## ✅ **What Already Works**

### **Using Existing Backend APIs:**
- ✅ Authentication (Login, Register, Google OAuth)
- ✅ Appointments (CRUD, Reschedule via UPDATE endpoint)
- ✅ Services & Categories
- ✅ Chat (Conversations, Messages)
- ✅ Profile (View, Edit, Avatar Upload, Password Change)
- ✅ Feedback/Ratings
- ✅ **Consent Waivers** - Uses `appointments.consent_waiver_form_data` field

---

## 🔨 **What Needs Backend Development**

### **1. Bills & Payments API Endpoints**

**Status:** Models and database exist, but NO API endpoints for mobile app.

#### **Required Endpoints:**

```php
// routes/api.php

Route::middleware('auth:sanctum')->prefix('client')->group(function () {
    
    // Bills
    Route::get('/users/{clientId}/bills', [BillApiController::class, 'getClientBills']);
    Route::get('/bills/{billId}', [BillApiController::class, 'getBill']);
    Route::get('/bills/{billId}/receipt', [BillApiController::class, 'downloadReceipt']);
    
    // Payments
    Route::get('/users/{clientId}/payments', [PaymentApiController::class, 'getClientPayments']);
    Route::post('/payments', [PaymentApiController::class, 'processPayment']);
    
    // Balance
    Route::get('/users/{clientId}/outstanding-balance', [BillApiController::class, 'getOutstandingBalance']);
});
```

#### **Expected Responses:**

**GET /client/users/{clientId}/bills**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_id": 5,
      "appointment_id": 10,
      "amount": 2500.00,
      "status": "pending",
      "due_date": "2024-01-30",
      "paid_date": null,
      "description": "Facial Treatment - Classic Hydration",
      "payment_method": null,
      "created_at": "2024-01-20T10:00:00Z",
      "updated_at": "2024-01-20T10:00:00Z",
      "appointment": {
        "id": 10,
        "service": {
          "service_name": "Facial Treatment"
        }
      }
    }
  ]
}
```

**GET /client/users/{clientId}/payments**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bill_id": 1,
      "amount": 2500.00,
      "payment_method": "Credit Card",
      "payment_date": "2024-01-25",
      "transaction_id": "TXN123456",
      "status": "completed",
      "created_at": "2024-01-25T14:00:00Z",
      "updated_at": "2024-01-25T14:00:00Z",
      "bill": {
        "id": 1,
        "description": "Facial Treatment"
      }
    }
  ]
}
```

**GET /client/users/{clientId}/outstanding-balance**
```json
{
  "success": true,
  "data": {
    "balance": 2500.00
  }
}
```

#### **Implementation Notes:**

**Create:** `app/Http/Controllers/Api/BillApiController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use Illuminate\Http\Request;

class BillApiController extends Controller
{
    public function getClientBills($clientId)
    {
        $bills = Bill::where('client_id', $clientId)
            ->with(['appointment.service'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bills
        ]);
    }

    public function getBill($billId)
    {
        $bill = Bill::with(['appointment.service', 'payments'])
            ->findOrFail($billId);

        return response()->json([
            'success' => true,
            'data' => $bill
        ]);
    }

    public function getOutstandingBalance($clientId)
    {
        $balance = Bill::where('client_id', $clientId)
            ->whereIn('status', ['pending', 'overdue'])
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => ['balance' => $balance]
        ]);
    }

    public function downloadReceipt($billId)
    {
        // Use existing PDF generation logic
        $bill = Bill::findOrFail($billId);
        // Return PDF or redirect to existing receipt endpoint
    }
}
```

**Create:** `app/Http/Controllers/Api/PaymentApiController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentApiController extends Controller
{
    public function getClientPayments($clientId)
    {
        $payments = Payment::whereHas('bill', function($query) use ($clientId) {
            $query->where('client_id', $clientId);
        })
        ->with(['bill'])
        ->orderBy('payment_date', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'bill_id' => 'required|exists:bills,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'transaction_id' => 'nullable|string',
        ]);

        $payment = Payment::create($validated);

        // Update bill status to 'paid' if fully paid
        $bill = $payment->bill;
        if ($bill->payments()->sum('amount') >= $bill->amount) {
            $bill->update(['status' => 'paid', 'paid_date' => now()]);
        }

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Payment processed successfully'
        ]);
    }
}
```

---

## ✅ **Already Working - No Backend Changes Needed**

### **2. Consent Waivers**

**Status:** ✅ Already functional using existing appointment API.

The mobile app uses the existing `appointments` API to store consent waiver data in the `consent_waiver_form_data` JSON field.

**How It Works:**
```typescript
// Mobile app sends consent waiver with appointment update
PUT /client/appointments/{id}
{
  "consent_waiver_form_data": {
    "appointment_id": 123,
    "date": "2024-01-25",
    "understands_procedure": true,
    "acknowledges_risks": true,
    "voluntary_consent": true,
    "accurate_information": true,
    "photo_consent": true,
    "privacy_policy": true
  }
}
```

**✅ This already works!** No backend changes needed.

---

## 📋 **Implementation Checklist**

### **Phase 1: Bills API (Priority: HIGH)**
- [ ] Create `BillApiController.php`
- [ ] Add route `GET /client/users/{clientId}/bills`
- [ ] Add route `GET /client/bills/{billId}`
- [ ] Add route `GET /client/users/{clientId}/outstanding-balance`
- [ ] Add route `GET /client/bills/{billId}/receipt`
- [ ] Test with mobile app

### **Phase 2: Payments API (Priority: HIGH)**
- [ ] Create `PaymentApiController.php`
- [ ] Add route `GET /client/users/{clientId}/payments`
- [ ] Add route `POST /client/payments`
- [ ] Implement payment processing logic
- [ ] Test with mobile app

### **Phase 3: Payment Gateway Integration (Priority: MEDIUM)**
- [ ] Integrate PayMongo or other Philippine payment gateway
- [ ] Add payment gateway credentials to `.env`
- [ ] Implement webhook handlers for payment confirmations
- [ ] Add payment status tracking

---

## 🔐 **Security Considerations**

1. **Authentication:** All endpoints should use `auth:sanctum` middleware
2. **Authorization:** Verify user can only access their own bills/payments
3. **Validation:** Validate all input data
4. **Rate Limiting:** Apply rate limiting to payment endpoints

---

## 🧪 **Testing**

After implementing, test with:

```bash
# Get bills
curl -X GET https://drveaestheticclinic.online/api/client/users/1/bills \
  -H "Authorization: Bearer {token}"

# Get payments
curl -X GET https://drveaestheticclinic.online/api/client/users/1/payments \
  -H "Authorization: Bearer {token}"

# Get balance
curl -X GET https://drveaestheticclinic.online/api/client/users/1/outstanding-balance \
  -H "Authorization: Bearer {token}"
```

---

## 📝 **Notes**

- **Database Ready:** `bills` and `payments` tables already exist
- **Models Ready:** Bill and Payment models with relationships exist
- **Mobile App Ready:** UI and API client code already implemented
- **Only Missing:** API endpoints and controllers

Once these endpoints are implemented, the mobile app's billing feature will be fully functional!

---

**Last Updated:** January 2025  
**Status:** Waiting for backend API implementation

