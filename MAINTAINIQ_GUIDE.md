# MaintainIQ — Complete Platform Guide
## Hackathon Batch-17 | Due: Jul 12, 2026

---

## KIYA KIYA GAYA HAI (What Was Built)

### 1. Authentication System ✅
- **Register** (`/auth/register`) — Username, email, password, role select
- **Login** (`/auth/login`) — JWT token, cookie-based session
- **Email Verification** (`/auth/verify-email`) — 6-digit OTP via email
- **4 Roles:** Administrator, Supervisor, Technician, Reporter

### 2. Asset Management ✅
- **Asset List** (`/dashboard/assets`) — Table with search, filter by category/status
- **Create Asset** (`/dashboard/assets/new`) — Full form with image upload
- **Asset Detail** (`/dashboard/assets/[id]`) — Complete profile, issues list, service history
- **Auto QR Code Generation** — Every asset gets a unique QR code (uploaded to Cloudinary)
- **Public Asset Page** (`/asset/[assetTag]/public`) — QR scan lands here, NO login required

### 3. Issue / Ticket Management ✅
- **Issues List** (`/dashboard/issues`) — Filter by status, priority, search
- **Log Manual Issue** (`/dashboard/issues/new`) — Staff can log issues directly
- **Issue Detail** (`/dashboard/issues/[id]`) — Full triage panel:
  - Assign technician
  - Change status (open → assigned → in_progress → resolved → closed)
  - Change priority
  - Add resolution notes
  - Get AI diagnosis
  - Log service record directly

### 4. Public QR Scan Page ✅ (The Key Feature)
- URL: `/asset/[assetTag]/public`
- **No login required** — Anyone who scans QR can report
- Shows asset name, category, location, status
- Shows active issues
- Report form with: title, description, priority, photo upload, reporter contact
- Photo is uploaded to Cloudinary automatically

### 5. AI Recommendations ✅ (Google Gemini — FREE)
- On issue detail page: click "Get AI Diagnosis"
- Uses **Google Gemini 1.5 Flash** (free tier)
- Provides: root cause analysis, action steps, preventive recommendations, priority, estimated time
- **Smart Fallback Engine** — If no API key, still gives intelligent recommendations based on category (HVAC, Electrical, Plumbing, IT)

### 6. Service History Ledger ✅
- **Service History List** (`/dashboard/service-history`) — All service records
- **Log Service Record** (`/dashboard/service-history/new`) — Full form with:
  - Asset selection
  - Link to open issue (auto-resolves it)
  - Service type (repair/preventive/inspection/replacement/upgrade)
  - Parts replaced
  - Cost (PKR)
  - Duration
  - Next service date scheduling

### 7. Dashboard Analytics ✅
- **Stats cards:** Total assets, open tickets, service records, technicians
- **Bar chart:** Issues by priority (using Recharts)
- **Pie chart:** Assets by category (using Recharts)
- **Recent Issues table** with priority badges
- All data is live from MongoDB

### 8. Middleware & Route Protection ✅
- All `/dashboard/*` routes require login
- `/asset/[tag]/public` is public (no auth)
- `/auth/*` routes are public
- Automatic redirect to login if token expired

---

## FREE APIs USED

### 1. Google Gemini 1.5 Flash (AI)
- **What it does:** AI maintenance diagnostics — root cause analysis, repair steps, preventive recommendations
- **Free tier:** 15 requests/minute, 1,000,000 tokens/day — MORE than enough
- **How to get key:**
  1. Go to: https://aistudio.google.com/app/apikey
  2. Sign in with Google account
  3. Click "Create API Key"
  4. Copy key and paste in `.env`:
     ```
     GEMINI_API_KEY=AIza...your_key_here
     ```
- **Cost:** 100% FREE for hackathon use
- **Note:** Even without key, app works — smart fallback engine kicks in

### 2. Cloudinary (Image & QR Upload)
- **What it does:** Stores asset images, issue photos, and QR code images
- **Already configured** in your `.env`:
  ```
  CLOUDINARY_CLOUD_NAME=dhu8yid4o
  CLOUDINARY_API_KEY=475317365872699
  CLOUDINARY_API_SECRET=...
  ```
- **Free tier:** 25 GB storage, 25 GB bandwidth/month — plenty
- **How it works:** Images are converted to base64 → uploaded to Cloudinary → permanent URL stored in MongoDB

### 3. MongoDB Atlas (Database)
- **Already configured** in your `.env`
- **Free tier:** 512 MB storage (M0 cluster)
- Stores: Users, Assets, Issues, ServiceRecords

### 4. Nodemailer + Custom SMTP (Email OTP)
- **Already configured** in your `.env`:
  ```
  EMAIL_USER=mail@abdulrehman.sbs
  EMAIL_PASS=dffz-25tz-miin-jq2d
  ```
- Sends email verification OTP codes

---

## PACKAGES INSTALLED

```
qrcode          — Generate QR codes as base64 PNG
@types/qrcode   — TypeScript types for qrcode
cloudinary      — Cloudinary SDK for image upload
uuid            — Generate unique asset tags (MIQ-XXXXXXXX)
@types/uuid     — TypeScript types for uuid
lucide-react    — All icons in the UI
react-hot-toast — Toast notifications
recharts        — Dashboard charts (bar + pie)
```

---

## HOW TO RUN LOCALLY

### Step 1: Get Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Create API key
4. Open `.env` file and change:
   ```
   GEMINI_API_KEY=your_actual_key_here
   ```

### Step 2: Start Dev Server
```bash
npm run dev
```
Open: http://localhost:3000

### Step 3: Register First Account
1. Go to http://localhost:3000/auth/register
2. Select role: **Supervisor** (recommended for demo)
3. Verify email with OTP
4. Login

### Step 4: Create First Asset
1. Dashboard → Asset Registry → Add New Asset
2. Fill details (name, category, location)
3. Click Create — QR code auto-generated!
4. Download QR code or open Public Page

### Step 5: Test QR Flow
1. Open the public page: `/asset/[assetTag]/public`
2. Report an issue (no login needed!)
3. Go back to dashboard — ticket appears in Issue Triage
4. Click the ticket → Get AI Diagnosis → Assign Technician → Log Service Record

---

## HOW TO DEPLOY ON VERCEL (1 deployment)

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "MaintainIQ complete"
   git push
   ```

2. Go to https://vercel.com → New Project → Import GitHub repo

3. Add Environment Variables in Vercel dashboard:
   ```
   MONGODB_URI          = (your MongoDB URI)
   JWT_SECRET           = (your JWT secret)
   EMAIL_USER           = (your email)
   EMAIL_PASS           = (your email password)
   CLOUDINARY_CLOUD_NAME = dhu8yid4o
   CLOUDINARY_API_KEY   = 475317365872699
   CLOUDINARY_API_SECRET = (your secret)
   GEMINI_API_KEY       = (your Gemini key)
   NEXT_PUBLIC_BASE_URL = https://your-project.vercel.app
   ```

4. Click Deploy!

**IMPORTANT:** After deploy, update `NEXT_PUBLIC_BASE_URL` to your actual Vercel URL (this makes QR codes point to the correct domain)

---

## PROJECT STRUCTURE

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles
│   │
│   ├── auth/
│   │   ├── login/page.tsx                # Login page
│   │   ├── register/page.tsx             # Register page
│   │   └── verify-email/page.tsx         # OTP verification
│   │
│   ├── asset/[tag]/public/page.tsx       # ⭐ QR SCAN PAGE (no auth)
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                    # Dashboard sidebar layout
│   │   ├── page.tsx                      # Dashboard home + charts
│   │   ├── assets/
│   │   │   ├── page.tsx                  # Assets list
│   │   │   ├── new/page.tsx              # Create asset
│   │   │   └── [id]/page.tsx             # Asset detail + QR
│   │   ├── issues/
│   │   │   ├── page.tsx                  # Issues list
│   │   │   ├── new/page.tsx              # Log manual issue
│   │   │   └── [id]/page.tsx             # Issue detail + AI + assign
│   │   └── service-history/
│   │       ├── page.tsx                  # Service records list
│   │       └── new/page.tsx              # Log service record
│   │
│   └── api/
│       ├── auth/login/                   # POST: login
│       ├── auth/create-account/          # POST: register
│       ├── auth/logout/                  # POST: logout
│       ├── auth/me/                      # GET: current user
│       ├── auth/verify/send-otp/         # POST: send OTP
│       ├── auth/verify/verify-otp/       # POST: verify OTP
│       ├── assets/                       # GET, POST
│       ├── assets/[id]/                  # GET, PUT, DELETE
│       ├── issues/                       # GET, POST
│       ├── issues/[id]/                  # GET, PUT, DELETE
│       ├── service-records/              # GET, POST
│       ├── ai/recommend/                 # POST: Gemini AI
│       ├── dashboard/stats/              # GET: all stats
│       ├── users/                        # GET: all users
│       ├── users/me/                     # GET: current user
│       └── upload/                       # POST: image upload
│
├── lib/
│   ├── db/index.ts                       # MongoDB connection
│   └── models/
│       ├── User.ts                       # User model
│       ├── Asset.ts                      # Asset model
│       ├── Issue.ts                      # Issue/Ticket model
│       └── ServiceRecord.ts              # Service record model
│
├── middleware.ts                         # Route protection
│
└── utils/
    ├── jwt/index.ts                      # JWT helper
    ├── cloudinary/index.ts               # Cloudinary upload
    ├── email/send.ts                     # Email utility
    ├── getUser/index.ts                  # Get current user
    └── otpGenerator/index.ts             # OTP generator
```

---

## DEMO WALKTHROUGH (For Presentation)

1. **Show Landing Page** → Professional, explains product
2. **Register** → Select Supervisor role → Verify email
3. **Dashboard** → Show stats (empty first time)
4. **Create Asset** → e.g., "HVAC Unit - Room 201, Building A"
5. **Show QR Code** → Download it
6. **Open Public Page** → Simulate QR scan → Report issue with photo
7. **Back to Dashboard** → See new ticket in Issues
8. **Open Issue** → Click "Get AI Diagnosis" → Show Gemini response
9. **Assign** to a technician → Status: In Progress
10. **Log Service Record** → Add parts, cost, next service date
11. **Service History** → Show permanent record
12. **Dashboard Charts** → Updated automatically

---

## IMPORTANT NOTES

- The AI works WITHOUT Gemini key (smart fallback) — so demo won't break even if key is missing
- QR codes point to `/asset/[assetTag]/public` — no login needed for reporters
- All images (QR codes, asset photos, issue photos) are stored on Cloudinary permanently
- MongoDB stores everything — even if server restarts, data persists
- The platform is mobile-first — QR scan page works perfectly on phone

---

*Built for Saylani Welfare Trust Hackathon Batch-17*
*Stack: Next.js 15, TypeScript, MongoDB, Mongoose, Cloudinary, Google Gemini AI, Recharts, Lucide Icons, Tailwind CSS*
