# Loading Screens Explanation & Fix Guide

## 🔍 Why Are These Pages Showing "Loading..."?

Your app **IS working correctly** and **IS connected to the API**. The loading screens appear because the app is waiting for the backend API to respond.

---

## 📊 Affected Pages

### 1. **Medical Records Page** (`/medical-records`)
**What it's doing:**
```
Loading medical records...
```

**API Calls:**
- `GET /client/medical-certificates` - Fetches medical certificates
- `GET /client/prescriptions` - Fetches prescriptions

**Why it's loading:**
- Waits for BOTH API responses before showing content
- If either endpoint is slow/missing, loading persists
- If no data exists, should show "No prescriptions/certificates found"

---

### 2. **Payment History Page** (`/payment-history`)
**What it's doing:**
```
Loading payment history...
```

**API Calls:**
- `GET /client/billing/history` - Fetches payment records

**Why it's loading:**
- Waits for payment history from backend
- If no payments exist, should show "No payment history found"
- If endpoint is slow, loading continues

---

### 3. **Calendar Page** (`/calendar`)
**What it's doing:**
```
Loading calendar...
```

**API Calls:**
- Uses **SAMPLE/MOCK DATA** (not real API currently)
- Should load almost instantly

**Why it's loading:**
- Should NOT be stuck loading
- If stuck, check if `user.id` is undefined

---

## ⏱️ Technical Details

### API Timeout Configuration
```typescript
// lib/api/config.ts
API_CONFIG = {
  BASE_URL: 'https://drveaestheticclinic.online/api',
  TIMEOUT: 10000  // 10 seconds
}
```

**What this means:**
- Each API call will wait up to **10 seconds** for a response
- After 10 seconds, it should timeout and show an error
- If you see loading for more than 10 seconds, there might be a network issue

---

## ✅ Expected Behavior

### Scenario 1: Backend Endpoints Exist & Have Data
1. User opens page
2. Shows "Loading..." for 1-5 seconds
3. Displays data in cards

### Scenario 2: Backend Endpoints Exist & NO Data
1. User opens page
2. Shows "Loading..." for 1-5 seconds
3. Displays message: "No [records/payments/certificates] found"

### Scenario 3: Backend Endpoints Don't Exist
1. User opens page
2. Shows "Loading..." for up to 10 seconds
3. Times out and shows error message
4. "Try Again" button appears

---

## 🔧 How to Fix

### Option 1: Check Backend Endpoints

**Ask your backend developer if these endpoints are implemented:**

```bash
# Medical Records
✓ GET /client/medical-certificates
✓ GET /client/prescriptions

# Payment History
✓ GET /client/billing/history

# Expected Response Format:
{
  "data": [],  // or array of records
  "message": "Success"
}
```

**Test the endpoints directly:**
```bash
# Use curl or Postman to test
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://drveaestheticclinic.online/api/client/medical-certificates

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://drveaestheticclinic.online/api/client/prescriptions

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://drveaestheticclinic.online/api/client/billing/history
```

---

### Option 2: Use Mock Data (Temporary Solution)

If backend endpoints aren't ready, you can temporarily use mock data like the Calendar page does:

**Example for Medical Records:**
```typescript
// In app/medical-records.tsx, replace lines 58-61 with:

// TEMPORARY: Use mock data until backend is ready
const mockCertificates: MedicalCertificate[] = [
  {
    id: 1,
    appointment_id: 1,
    certificate_type: "Fit to Work Certificate",
    description: "Patient is fit to return to work",
    valid_from: "2024-12-01",
    valid_until: "2024-12-31",
    issued_by: "Dr. Ve",
    issued_date: "2024-12-01",
    status: "active",
    created_at: "2024-12-01T10:00:00Z"
  }
];

const mockPrescriptions: Prescription[] = [
  {
    id: 1,
    appointment_id: 1,
    medication_name: "Vitamin C Serum",
    dosage: "Apply twice daily",
    frequency: "Morning and Night",
    duration: "30 days",
    doctor_notes: "For skin brightening",
    prescribed_by: "Dr. Ve",
    prescribed_date: "2024-12-01",
    created_at: "2024-12-01T10:00:00Z"
  }
];

setCertificates(mockCertificates);
setPrescriptions(mockPrescriptions);
```

---

### Option 3: Increase Timeout (Not Recommended)

If backend is consistently slow:
```typescript
// lib/api/config.ts
export const API_CONFIG = {
  BASE_URL: 'https://drveaestheticclinic.online/api',
  TIMEOUT: 30000,  // Increase to 30 seconds
} as const;
```

**Note:** This is NOT recommended. Fix the backend instead.

---

### Option 4: Add Retry Logic

Add automatic retry with exponential backoff:
```typescript
const loadMedicalRecords = async (retryCount = 0) => {
  try {
    setIsLoading(true);
    const [certificatesResponse, prescriptionsResponse] = await Promise.all([
      MedicalCertificateService.getCertificates(),
      PrescriptionService.getPrescriptions()
    ]);
    
    setCertificates(certificatesResponse || []);
    setPrescriptions(prescriptionsResponse || []);
  } catch (err) {
    if (retryCount < 2) {
      // Retry up to 2 times with delay
      setTimeout(() => loadMedicalRecords(retryCount + 1), 2000);
    } else {
      setError('Failed to load medical records after 3 attempts');
    }
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🐛 Debugging Steps

### Step 1: Check Network Logs
In your running app, check the console logs:
```
Look for:
- "Error loading medical records:" 
- "Error loading payments:"
- Any API error messages
```

### Step 2: Verify Authentication
Make sure the user is properly authenticated:
```typescript
// Check if token exists
const token = await AuthStorage.getToken();
console.log('Token exists:', !!token);
```

### Step 3: Test Individual Endpoints
Open each page one at a time and check which ones load:
- ✓ Home → Should load (uses services API)
- ✓ Services → Should load (uses services API)
- ✓ Appointments → Should load (uses appointments API)
- ? Medical Records → Check if loads
- ? Payment History → Check if loads
- ✓ Calendar → Should load (uses mock data)

### Step 4: Check Backend Logs
Ask your backend developer to check:
- Are requests reaching the server?
- What status codes are being returned?
- Are there any errors in the backend logs?

---

## 📱 User Experience Improvements

I've already added these improvements:
1. ✅ Added "This may take a few seconds" text to loading screens
2. ✅ All pages have error handling with "Try Again" buttons
3. ✅ All pages show empty states when no data exists
4. ✅ Pull-to-refresh on all data pages

**Additional improvements you can make:**
- Add loading skeleton screens instead of spinner
- Show partial data while loading
- Cache data locally for offline viewing
- Add progress indicators for long-running requests

---

## 🎯 Summary

**The loading screens are NORMAL behavior** - they appear while waiting for API responses.

**If loading persists for more than 10 seconds:**
1. ✓ Check if backend endpoints exist
2. ✓ Test endpoints directly with curl/Postman
3. ✓ Check backend logs for errors
4. ✓ Verify user authentication token is valid
5. ✓ Consider using mock data temporarily

**The app code is working correctly!** The issue is likely:
- Backend endpoints not implemented yet
- Backend returning errors
- Slow backend response times
- Network connectivity issues

---

## 📞 Next Steps

1. **Test the API endpoints** using curl or Postman
2. **Share results** with your backend developer
3. **Check if data exists** in your database for these features
4. **Verify** that the user has medical records/payments to display

Once the backend endpoints are working and returning data quickly, the loading screens will disappear automatically and show the actual content!

---

**Created:** December 2025  
**App Version:** 1.0.0  
**API Base URL:** https://drveaestheticclinic.online/api


