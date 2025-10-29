# Dr. Ve Aesthetic App - Page-by-Page Visualization

## 📱 App Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     APP ENTRY POINT                          │
│                      (index.tsx)                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Check Authentication Status                       │    │
│  │  • If authenticated → Redirect to /home           │    │
│  │  • If not → Redirect to /login                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### **Login Page** (`/login`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│         Welcome Back                    │
│   Sign in to continue to your account   │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────┐    │
│  │         Sign In Card           │    │
│  │                               │    │
│  │  📧 Email Input               │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │ Enter your email address │ │    │
│  │  └─────────────────────────┘ │    │
│  │                               │    │
│  │  🔒 Password Input            │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │ Enter your password      │ │    │
│  │  └─────────────────────────┘ │    │
│  │                               │    │
│  │  ☑️ Remember me               │    │
│  │                               │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │    Sign In Button       │ │    │
│  │  └─────────────────────────┘ │    │
│  │                               │    │
│  │  ───────── or ─────────      │    │
│  │                               │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │ Continue with Google    │ │    │
│  │  └─────────────────────────┘ │    │
│  │                               │    │
│  │  Don't have an account?       │    │
│  │  Create account →             │    │
│  └───────────────────────────────┘    │
│                                         │
│  Terms of Service | Privacy Policy      │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Sign In** | Submits email/password | • Validates credentials<br>• On success: Saves token, navigates to `/home`<br>• On error: Shows error message |
| **Continue with Google** | Google OAuth flow | • Opens Google sign-in<br>• On success: Saves token, navigates to `/home` |
| **Create account** (Link) | Navigation | • Navigates to `/signup` page |

---

### **Sign Up Page** (`/signup`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│         Create Account                  │
│   Join Dr. Ve Aesthetic Clinic          │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────┐    │
│  │      Registration Form         │    │
│  │                               │    │
│  │  📝 Name                       │    │
│  │  📧 Email                      │    │
│  │  📱 Phone                      │    │
│  │  🔒 Password                   │    │
│  │  🔒 Confirm Password           │    │
│  │                               │    │
│  │  ☑️ Agree to Terms            │    │
│  │                               │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │   Create Account        │ │    │
│  │  └─────────────────────────┘ │    │
│  │                               │    │
│  │  Already have an account?     │    │
│  │  Sign in →                    │    │
│  └───────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Create Account** | Submits registration form | • Validates all fields<br>• Creates user account<br>• Auto-login and navigate to `/home` |
| **Sign in** (Link) | Navigation | • Navigates to `/login` page |

---

## 🏠 Main App Pages

### **Home Page** (`/home`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo] Dr. Ve Aesthetic                │
│         Professional Beauty Care        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   Hero Section                  │  │
│  │   • Background Image            │  │
│  │   • Welcome message            │  │
│  │   • "Book Appointment" Button  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   Quick Stats Card              │  │
│  │   ┌─────┐ ┌─────┐ ┌─────┐      │  │
│  │   │ X   │ │ Y   │ │ Z   │      │  │
│  │   │Serv │ │Appt │ │Upcom│      │  │
│  │   └─────┘ └─────┘ └─────┘      │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   Next Appointment Widget        │  │
│  │   • Service name                │  │
│  │   • Date & Time                 │  │
│  │   • Status Badge                │  │
│  │   [View Details Button]         │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Appointment Statistics:                │
│  Pending | Confirmed | Completed        │
│                                         │
│  Popular Services                       │
│  View All →                            │
│  ┌─────────────────────────────────┐  │
│  │ [Icon] Service Name             │  │
│  │ Category Badge                  │  │
│  │ Description...                  │  │
│  │ ₱Price  [Book Button]           │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Recent Activity                        │
│  ┌─────────────────────────────────┐  │
│  │ Last Appointment Card           │  │
│  │ [Book Again Button]             │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Book Appointment** (Hero) | Navigation | • Navigates to `/services` page |
| **View Details** (Next Appointment) | Navigation | • Navigates to `/appointments` page |
| **View All** (Services) | Navigation | • Navigates to `/services` page |
| **Book** (Service Card) | Modal | • Opens `AppointmentFormModal`<br>• Pre-fills selected service |
| **Book Again** (Recent Activity) | Modal | • Opens `AppointmentFormModal`<br>• Pre-fills last completed service |

---

### **Services Page** (`/services`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo] Dr. Ve Aesthetic                │
│         Our Services                    │
├─────────────────────────────────────────┤
│                                         │
│  Our Services                           │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ 🔍 Search services...          │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Browse by Category                     │
│  ┌─────────────────────────────────┐  │
│  │ [All] [Facial] [Massage] [Skin] │  │
│  └─────────────────────────────────┘  │
│                                         │
│  X services                              │
│  ┌─────────────────────────────────┐  │
│  │ [Icon] Service Name             │  │
│  │ Category Badge                  │  │
│  │ Description...                  │  │
│  │ • X bookings                    │  │
│  │ • X mins duration               │  │
│  │ • Available/Coming Soon        │  │
│  │                                 │  │
│  │ ₱Price      [Book Now Button]   │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **All Services** / **Category Buttons** | Filter | • Filters services by category<br>• Updates service list |
| **Clear Filters** | Reset | • Clears search query<br>• Resets category filter |
| **Book Now** (Service Card) | Modal | • Opens `AppointmentFormModal`<br>• Pre-fills selected service<br>• On success: Refreshes services list |

---

### **Appointments Page** (`/appointments`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo] Dr. Ve Aesthetic                │
│         My Appointments                 │
├─────────────────────────────────────────┤
│                                         │
│  Appointments              [Refresh]    │
│                                         │
│  Filter: [All] [Pending] [Confirmed]   │
│         [Completed] [Cancelled]         │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Facial Treatment        [Pending]│  │
│  │ ID: #123                        │  │
│  │                                 │  │
│  │ 📅 Jan 15, 2024 at 2:00 PM     │  │
│  │ ₱1,500.00                      │  │
│  │ First time facial treatment     │  │
│  │                                 │  │
│  │ [Reschedule] [Cancel]          │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Skin Rejuvenation      [Completed]│  │
│  │ ID: #124                        │  │
│  │                                 │  │
│  │ 📅 Jan 10, 2024 at 10:00 AM    │  │
│  │ ₱2,500.00                      │  │
│  │                                 │  │
│  │ [Rate] [View Certificates]     │  │
│  │ [Book Again]                   │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Refresh** | Reload | • Refetches appointments from API<br>• Updates appointment list |
| **Filter Buttons** (All/Pending/etc.) | Filter | • Filters appointments by status<br>• Updates displayed list |
| **Reschedule** (Pending/Confirmed) | Modal | • Opens `RescheduleAppointmentModal`<br>• Allows date/time change<br>• On success: Refreshes appointments |
| **Cancel** (Pending/Confirmed) | Alert | • Shows confirmation dialog<br>• On confirm: Cancels appointment<br>• Updates status to "cancelled" |
| **Rate** (Completed) | Modal | • Opens `FeedbackDialog`<br>• User can rate 1-5 stars<br>• Add comment<br>• On submit: Saves feedback |
| **View Certificates** (Completed) | Navigation | • Navigates to Medical Records page<br>• Opens Certificates tab<br>• Shows certificates related to completed appointment |
| **Book Again** (Completed/Cancelled) | Alert | • Shows info dialog<br>• Prompts to call clinic<br>• OR opens booking modal |

---

### **Chat Page** (`/chat`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [←] [Logo] Dr. Ve Aesthetic            │
│         Chat Support                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  [Avatar] Welcome message...    │  │
│  │  [Avatar] How can I help you?   │  │
│  └─────────────────────────────────┘  │
│                                         │
│            ┌─────────────────────┐     │
│            │ Your message here   │     │
│            └─────────────────────┘     │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Message...              [Send]  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Back Arrow** (←) | Navigation | • Navigates back to previous page |
| **Send** (Message Input) | Send Message | • Sends message to clinic staff<br>• Adds message to chat<br>• Auto-scrolls to bottom<br>• Starts polling for responses |
| **Message Input** | Typing | • Shows typing indicator<br>• Auto-expands text area |

**Features:**
- Real-time message polling (every 2 seconds)
- Auto-scroll to latest message
- Welcome message on first chat
- Message timestamps
- Avatar indicators for staff/client

---

### **Profile Page** (`/profile`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo] Dr. Ve Aesthetic                │
│         My Profile                      │
├─────────────────────────────────────────┤
│                                         │
│  Profile                                 │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │         [Avatar]                │  │
│  │       User Name                 │  │
│  │    [Edit Profile Button]        │  │
│  └─────────────────────────────────┘  │
│                                         │
│  User's Stats                           │
│  ┌─────────────────────────────────┐  │
│  │ X Bookings | ★ Loyalty | Year  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Account Settings                       │
│  ┌─────────────────────────────────┐  │
│  │ • Personal Information →        │  │
│  │ • Billing & Payments →          │  │
│  │ • Payment History →            │  │
│  │ • Medical Records →            │  │
│  │ • Calendar View →              │  │
│  │ • Change Password →            │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Support & Information                  │
│  ┌─────────────────────────────────┐  │
│  │ • Help & Support →              │  │
│  │ • About App →                  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │      Sign Out Button            │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Avatar** (Tap) | Image Picker | • Opens camera/gallery options<br>• On select: Uploads new avatar<br>• Updates profile picture |
| **Edit Profile** | Modal | • Opens full-screen edit modal<br>• Fields: Name, Email, Phone, Address, DOB<br>• On save: Updates profile via API |
| **Personal Information** | Alert | • Shows user details in alert dialog |
| **Billing & Payments** | Navigation | • Navigates to `/billing` page |
| **Payment History** | Navigation | • Navigates to `/payment-history` page |
| **Medical Records** | Navigation | • Navigates to `/medical-records` page |
| **Calendar View** | Navigation | • Navigates to `/calendar` page |
| **Change Password** | Dialog | • Opens password change dialog<br>• Requires: Current, New, Confirm<br>• On success: Updates password |
| **Help & Support** | Alert | • Shows contact information |
| **About App** | Alert | • Shows app version and info |
| **Sign Out** | Alert | • Confirmation dialog<br>• On confirm: Logs out, clears tokens<br>• Navigates to `/login` |

---

### **Billing & Payments Page** (`/billing`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo] Dr. Ve Aesthetic                │
│         Billing & Payments              │
├─────────────────────────────────────────┤
│                                         │
│  Billing & Payments                     │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ ✅ System Active                │  │
│  │ View bills, process payments,   │  │
│  │ and download receipts.          │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Outstanding Balance (if any)           │
│  ┌─────────────────────────────────┐  │
│  │ Outstanding Balance             │  │
│  │ ₱2,500.00                      │  │
│  │ 1 unpaid bill(s)               │  │
│  │ [Dollar Icon]                  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Statistics                              │
│  ┌─────────────────────────────────┐  │
│  │ ₱3,500  ₱2,500  ₱6,000        │  │
│  │ Paid    Pending  Total         │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Filter: [All] [Pending] [Paid]        │
│         [Overdue]                       │
│                                         │
│  Bills List:                            │
│  ┌─────────────────────────────────┐  │
│  │ Facial Treatment - Classic      │  │
│  │ Bill #1 • Jan 15, 2024 [Pending]│  │
│  │                                 │  │
│  │ ₱2,500.00          Due: Jan 22 │  │
│  │                                 │  │
│  │ [Pay Now Button]               │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Skin Rejuvenation Treatment     │  │
│  │ Bill #2 • Jan 5, 2024 [Paid]   │  │
│  │                                 │  │
│  │ ₱3,500.00          Due: Jan 15 │  │
│  │ ✓ Paid on Jan 10 • Credit Card │  │
│  │                                 │  │
│  │ [Download Receipt Button]      │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Filter Buttons** | Filter | • Filters bills by status<br>• Updates displayed list |
| **Pay Now** (Pending/Overdue) | Alert | • Shows payment confirmation<br>• Processes payment via API<br>• Updates bill status to paid |
| **Download Receipt** (Paid) | Download | • Downloads PDF receipt to device<br>• Opens share sheet for saving/sharing |

---

### **Payment History Page** (`/payment-history`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Payment History                    │
├─────────────────────────────────────────┤
│                                         │
│  Payment History                        │
│                                         │
│  Summary                                 │
│  ┌─────────────────────────────────┐  │
│  │ ₱6,000.00                      │  │
│  │ Total Payments                  │  │
│  │ 3 Completed  1 Pending          │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Recent Payments                        │
│  ┌─────────────────────────────────┐  │
│  │ ₱2,500.00              [Paid]  │  │
│  │ Facial Treatment - Classic     │  │
│  │ 💳 Credit Card • Jan 10 at 2:30│  │
│  │ ID: TXN123456                  │  │
│  │                                 │  │
│  │ [Download Receipt Button]      │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ ₱3,500.00              [Paid]  │  │
│  │ Skin Rejuvenation Treatment    │  │
│  │ 💳 Credit Card • Jan 5 at 1:15 │  │
│  │ ID: TXN123457                  │  │
│  │                                 │  │
│  │ [Download Receipt Button]      │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Back Arrow** (←) | Navigation | • Navigates back to profile |
| **Download Receipt** | Download | • Downloads PDF payment receipt<br>• Opens share sheet for saving/sharing |

---

### **Medical Records Page** (`/medical-records`)

**How to Access:**
1. **From Profile:**
   - Go to **Profile** page (bottom navigation)
   - Scroll to **Account Settings** section
   - Tap **Medical Records** → "Prescriptions and certificates"
   - Navigates to Medical Records page

2. **From Completed Appointments:**
   - Go to **Appointments** page
   - Filter to view **Completed** appointments
   - Tap **View Certificates** button on any completed appointment
   - Automatically navigates to Medical Records page with Certificates tab open

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Medical Records                    │
├─────────────────────────────────────────┤
│                                         │
│  [Prescriptions] [Certificates] (Tabs)  │
│                                         │
│  Prescriptions Tab:                     │
│  ┌─────────────────────────────────┐  │
│  │ Prescriptions (X)               │  │
│  │                                 │  │
│  │ ┌─────────────────────────────┐ │  │
│  │ │ Prescription Card            │ │  │
│  │ │ Medication: [Name]          │ │  │
│  │ │ Prescribed by: Dr. Name     │ │  │
│  │ │ Date: January 15, 2024     │ │  │
│  │ │                             │ │  │
│  │ │ Dosage: XXXmg               │ │  │
│  │ │ Frequency: Daily            │ │  │
│  │ │ Duration: 7 days            │ │  │
│  │ │                             │ │  │
│  │ │ Doctor's Notes:             │ │  │
│  │ │ [Notes content...]          │ │  │
│  │ └─────────────────────────────┘ │  │
│  │                                 │  │
│  │ (Scrollable list of all         │  │
│  │  prescriptions)                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Certificates Tab:                      │
│  ┌─────────────────────────────────┐  │
│  │ Medical Certificates (X)        │  │
│  │                                 │  │
│  │ ┌─────────────────────────────┐ │  │
│  │ │ Certificate Card  [Badge]   │ │  │
│  │ │ Type: Medical Certificate   │ │  │
│  │ │ Issued by: Dr. Name        │ │  │
│  │ │ Description: ...           │ │  │
│  │ │                             │ │  │
│  │ │ Valid From: Jan 15, 2024   │ │  │
│  │ │ Valid Until: Jan 22, 2024 │ │  │
│  │ │ Issued Date: Jan 15, 2024 │ │  │
│  │ └─────────────────────────────┘ │  │
│  │                                 │  │
│  │ (Scrollable list of all         │  │
│  │  certificates)                  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Back Arrow** (←) | Navigation | • Navigates back to Profile page |
| **Prescriptions Tab** | Switch | • Shows all prescriptions in card format<br>• Each card displays: medication name, dosage, frequency, duration, doctor's notes, prescribed date |
| **Certificates Tab** | Switch | • Shows all medical certificates in card format<br>• Each card displays: certificate type, description, validity dates, status badge (Active/Expired), issued by |
| **Pull to Refresh** | Refresh | • Reloads prescriptions and certificates from API |

**Viewing Details:**

**Prescriptions:**
- Each prescription is displayed as a card with:
  - Medication name (heading)
  - Prescribed by (doctor name)
  - Prescribed date
  - Dosage, frequency, duration (in rows)
  - Doctor's notes (if available, in highlighted box)
- All prescriptions are listed vertically (scrollable)
- View-only - no action buttons

**Certificates:**
- Each certificate is displayed as a card with:
  - Certificate type (heading)
  - Issued by (doctor/clinic name)
  - Status badge (Active/Expired/Cancelled) - color coded
  - Description text
  - Valid from date
  - Valid until date (red if expired)
  - Issued date
- All certificates are listed vertically (scrollable)
- View-only - no download or share buttons

**Note:** 
- **Prescriptions**: View-only. Users can see all prescription details (medication, dosage, frequency, duration, doctor's notes) but cannot download them.
- **Certificates**: View-only. Users can see certificate details (type, validity dates, status, issued by) but cannot download or share them.
- Data loads automatically when page opens
- Pull down to refresh updates the list

---

### **Calendar Page** (`/calendar`)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Calendar View                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │  ←   │  │ Jan  │  │  →   │         │
│  └──────┘  └──────┘  └──────┘         │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Calendar Grid                  │  │
│  │  S  M  T  W  T  F  S            │  │
│  │  1  2  3  4  5  6  7            │  │
│  │  8  9 10 11 12 13 14            │  │
│  │ 15 [16]17 18 19 20 21           │  │
│  │ 22 23 24 25 26 27 28            │  │
│  │ (Days with appointments marked) │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Selected Date: January 16, 2024      │
│                                         │
│  Appointments:                          │
│  ┌─────────────────────────────────┐  │
│  │ [10:00 AM] Service Name         │  │
│  │ Status: Confirmed                │  │
│  │ [View Details]                  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Bottom Navigation Bar]                │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Back Arrow** (←) | Navigation | • Navigates back to profile |
| **Previous Month** (←) | Navigate | • Changes to previous month<br>• Updates calendar grid |
| **Next Month** (→) | Navigate | • Changes to next month<br>• Updates calendar grid |
| **Date Selection** | Select | • Selects date<br>• Shows appointments for that date |
| **View Details** | View | • Shows appointment details<br>• Opens appointment card |

---

## 📋 Modal Components

### **Appointment Form Modal**

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  Book Appointment        [X]            │
├─────────────────────────────────────────┤
│                                         │
│  Service: [Pre-filled Service Name]     │
│                                         │
│  Select Date:                          │
│  ┌─────────────────────────────────┐  │
│  │ [Calendar Icon] January 15... │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Select Time:                          │
│  ┌─────────────────────────────────┐  │
│  │ [8:00 AM] [9:00 AM] [10:00 AM] │  │
│  │ [11:00 AM] [1:00 PM] ...        │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Medical History:                       │
│  ☐ Hypertension  ☐ Diabetes            │
│  ☐ Heart Disease  ☐ Allergies         │
│  ...                                    │
│                                         │
│  Personal Status:                       │
│  ☐ Pregnant  ☐ Breastfeeding            │
│  ☐ Smoker  ☐ Alcohol Consumer           │
│                                         │
│  Additional Notes:                      │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │       Book Appointment         │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Close (X)** | Close | • Closes modal without saving |
| **Date Picker** | Date Selection | • Opens date picker<br>• Updates selected date<br>• Filters available time slots |
| **Time Slot** | Time Selection | • Selects appointment time<br>• Highlights selected slot |
| **Checkboxes** | Toggle | • Updates medical history/personal status |
| **Book Appointment** | Submit | • Validates form<br>• Creates appointment via API<br>• On success: Closes modal, refreshes data<br>• On error: Shows error message |

---

### **Reschedule Appointment Modal**

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  Reschedule Appointment                 │
├─────────────────────────────────────────┤
│                                         │
│  Service: [Service Name]                │
│                                         │
│  Current Date: January 15, 2024        │
│  Current Time: 2:00 PM                  │
│                                         │
│  New Date:                              │
│  ┌─────────────────────────────────┐  │
│  │ [Calendar Icon] Select date... │  │
│  └─────────────────────────────────┘  │
│                                         │
│  New Time:                              │
│  ┌─────────────────────────────────┐  │
│  │ [8:00 AM] [9:00 AM] ...        │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │        Reschedule              │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Date Picker** | Date Selection | • Opens date picker<br>• Updates new date |
| **Time Slot** | Time Selection | • Selects new appointment time |
| **Reschedule** | Submit | • Validates date/time<br>• Updates appointment via API<br>• On success: Closes modal, refreshes list |

---

### **Feedback Dialog** (Rating Modal)

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│        Rate Service                      │
├─────────────────────────────────────────┤
│                                         │
│  How was your experience with           │
│  [Service Name]?                        │
│                                         │
│         ★ ★ ★ ★ ★                       │
│                                         │
│  Comments (Optional):                    │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Cancel]  [Submit]                    │
└─────────────────────────────────────────┘
```

**Button Interactions:**

| Button | Action | Result |
|--------|--------|--------|
| **Star Rating** | Rate | • Selects star rating (1-5)<br>• Updates selected stars |
| **Cancel** | Close | • Closes dialog without saving |
| **Submit** | Submit | • Saves rating and comment<br>• Creates feedback record<br>• On success: Closes dialog, shows success message |

---

## 🧭 Bottom Navigation Bar

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│  [🏠]    [✂️]    [💬]    [📅]    [👤]  │
│  Home   Services  Chat  Bookings Profile│
│                                         │
└─────────────────────────────────────────┘
```

**Navigation Items:**

| Icon | Label | Path | Action |
|------|-------|------|--------|
| 🏠 | Home | `/home` | Navigates to home page |
| ✂️ | Services | `/services` | Navigates to services page |
| 💬 | Chat | `/chat` | Navigates to chat page<br>• Shows unread count badge |
| 📅 | Bookings | `/appointments` | Navigates to appointments page |
| 👤 | Profile | `/profile` | Navigates to profile page |

**Features:**
- Active page highlighted with primary color
- Unread message count badge on Chat icon
- Always visible at bottom of screen

---

## 📱 Mobile UI Optimizations

### **Compact Design Features:**
- **Reduced Padding**: `px-4` instead of `px-6` for better space utilization
- **Smaller Text Sizes**: Mobile-optimized typography (text-2xl, text-lg, text-sm)
- **Condensed Cards**: Essential information only, cleaner layouts
- **Efficient Buttons**: Better touch targets and spacing
- **Emoji Icons**: Visual indicators for quick scanning (📅, 💳, ✓)

### **Download Functionality:**
- **Bill Receipts**: Download PDF receipts for paid bills
- **Payment Receipts**: Download PDF payment confirmations
- **Share Integration**: Native share sheet for saving/sharing files
- **File Management**: Automatic file naming and storage

---

## 🔄 Page Navigation Flow

```
┌─────────┐
│  Index  │
└────┬────┘
     │
     ├─ Authenticated? ──Yes──→ ┌─────────┐
     │                          │  Home    │
     │                          └────┬─────┘
     │                               │
     └─ No ───────────────┐          │
                         │          │
                    ┌────▼─────┐    │
                    │  Login   │    │
                    └────┬─────┘    │
                         │          │
                    ┌────▼─────┐    │
                    │  Signup  │    │
                    └────┬─────┘    │
                         │          │
                         └──────────┘
                                    
Home ──→ Services ──→ [Book Modal] ──→ Appointments
  │         │                              │
  │         └──→ Chat                      │
  │                                         │
  └──→ Profile ──→ Billing ──→ Payment History
         │         │                        │
         │         └──→ Payment History ────┘
         │                                  │
         └──→ Medical Records               │
         │                                  │
         └──→ Calendar                     │
         │                                  │
         └──→ Edit Profile (Modal)          │
         │                                  │
         └──→ Change Password (Dialog)      │
                                            │
Appointments ──→ [Reschedule Modal] ─────────┘
              │
              └──→ [Rate Modal] ──→ Feedback

Navigation Paths:
• Home → Services → [Book Modal] → Appointments
• Home → Chat → [Individual Chat]
• Home → Profile → Billing → Payment History
• Home → Profile → Medical Records
• Home → Profile → Calendar
• Appointments → [Reschedule Modal]
• Appointments → [Rate Modal] → Feedback
```

---

## 📱 Key Features Summary

### **Authentication**
- Email/Password login
- Google Sign-In (optional)
- Remember Me functionality
- Auto-redirect based on auth status

### **Appointment Management**
- Browse services by category
- Search services
- Book appointments with date/time selection
- View all appointments with status filters
- Reschedule appointments
- Cancel appointments
- Rate completed services

### **Communication**
- Real-time chat with clinic staff
- Message polling every 2 seconds
- Auto-scroll to latest messages
- Welcome messages on first contact

### **Profile Management**
- View profile information
- Edit profile (name, email, phone, address, DOB)
- Upload avatar (camera/gallery)
- Change password
- View stats (bookings, loyalty, member since)

### **Additional Features**
- **Billing & Payments**: ✅ View outstanding balances, bills, process payments, and download receipts
- **Payment History**: ✅ Track all payment transactions with downloadable receipts
- **Medical Records**: Access prescriptions and medical certificates
- **Calendar View**: Visual calendar with appointment dates highlighted
- **Help & Support**: Contact information and app details

---

## 🎨 UI Components Used

- **Cards**: Display information containers
- **Buttons**: Primary actions
- **Inputs**: Form fields
- **Modals**: Overlay dialogs
- **Badges**: Status indicators
- **Avatars**: User profile images
- **Bottom Navigation**: Main app navigation
- **Date/Time Pickers**: Appointment scheduling

---

## 🔐 Security Features

- Input validation on all forms
- Audit logging for sensitive actions
- Token-based authentication
- Secure password storage
- Session management

---

---

## ✅ Current Implementation Status

### **Fully Functional Features:**
- ✅ **Authentication**: Login, Register, Google OAuth
- ✅ **Appointments**: Book, reschedule, cancel, rate services
- ✅ **Services**: Browse, filter, book appointments
- ✅ **Chat**: Real-time messaging with clinic
- ✅ **Profile**: View/edit profile, change password
- ✅ **Billing**: View bills, process payments, download receipts
- ✅ **Payment History**: Track payments, download receipts
- ✅ **Medical Records**: View prescriptions and certificates
- ✅ **View Certificates**: Direct access from completed appointments

### **Mobile Optimizations:**
- ✅ **Compact Layouts**: Optimized for phone screens
- ✅ **Download Functionality**: PDF receipts and bills
- ✅ **Touch-Friendly UI**: Proper button sizes and spacing
- ✅ **Visual Indicators**: Emojis and status badges

### **Backend Integration:**
- ✅ **API Endpoints**: All billing and payment endpoints implemented
- ✅ **Authentication**: Secure token-based auth
- ✅ **File Downloads**: PDF generation and download
- ✅ **Real-time Data**: Live appointment and payment data

---

*Last Updated: January 2025 - Complete mobile app with full functionality*

