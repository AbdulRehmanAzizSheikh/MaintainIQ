# MaintainIQ — Poori Project Ki Complete Guide
## Hackathon Batch-17 | Saylani Welfare Trust

---

# PEHLE SAMJHO — YA PROJECT KYA HAI?

MaintainIQ ek **Physical Asset Maintenance Management Platform** hai.

**Seedha matlab:** Kisi bhi building, school, hospital, factory mein jo bhi equipment lagea hota hai — AC, generator, projector, lift, computer, fire extinguisher — uska ek **digital identity card** ban jaata hai. Uss equipment par ek **QR code** lagaya jaata hai. Koi bhi banda (student, staff, visitor) uss QR ko apne phone se scan kare, problem report kare — bina login ke. Manager/Supervisor ko notification milti hai, technician ko assign karta hai, AI diagnosis deta hai, kaam hone ke baad service record ban jaata hai permanently.

---

# EK SAATH MULTIPLE ORGANIZATIONS USE KAR SAKTI HAIN?

## FILHAAL: NAHI (Single Tenant)
Abhi ka code **single-tenant** hai — matlab ek database mein sab ka data ek jagah hai. Koi separation nahi hai organizations ke beech. Agar Saylani aur PIAIC dono use karein toh dono ke assets, issues, users ek hi database mein honge — koi boundary nahi.

## FUTURE MEIN MULTI-TENANT BANANA HO TO:
User model mein ek `organization` field (ObjectId) add karna hoga, phir har query mein `{ organization: currentUser.organization }` filter lagana hoga. Is waqt yeh implementation existing code mein nahi hai.

## HACKATHON KE LIE KYA KARNA CHAHIE:
**Demo ke liye yeh bilkul theek hai.** Judges ko ek hi organization ka demo dikhana hoga — school ya hospital ka example lete hue sab features demonstrate karo. Multi-tenancy feature ke baare mein "future roadmap" ke tor par mention karo.

---

# POORI PROJECT KI FILE STRUCTURE

```
MaintainIQ/
│
├── .env                          ← Saari secret keys yahan hain
├── package.json                  ← Installed packages ki list
├── next.config.ts                ← Next.js settings (Cloudinary domain etc.)
├── middleware.ts                 ← Route guard (kon sa page public, kon sa private)
│
└── src/
    ├── app/                      ← Saare pages aur API routes
    │   ├── page.tsx              ← Landing page (/)
    │   ├── layout.tsx            ← Root HTML wrapper
    │   ├── globals.css           ← Global CSS styles
    │   │
    │   ├── auth/                 ← Authentication pages
    │   │   ├── login/page.tsx    ← /auth/login
    │   │   ├── register/page.tsx ← /auth/register
    │   │   └── verify-email/page.tsx ← /auth/verify-email
    │   │
    │   ├── asset/[tag]/public/page.tsx  ← QR SCAN PAGE (no login needed!)
    │   │
    │   ├── dashboard/            ← Logged-in users ka area
    │   │   ├── layout.tsx        ← Sidebar navigation
    │   │   ├── page.tsx          ← Dashboard home (stats + charts)
    │   │   ├── assets/           ← Asset management
    │   │   │   ├── page.tsx      ← Assets list
    │   │   │   ├── new/page.tsx  ← Create new asset
    │   │   │   └── [id]/page.tsx ← Single asset detail + QR
    │   │   ├── issues/           ← Issue/ticket management
    │   │   │   ├── page.tsx      ← All issues list
    │   │   │   ├── new/page.tsx  ← Log manual issue
    │   │   │   └── [id]/page.tsx ← Issue detail + AI + assign
    │   │   └── service-history/  ← Service records
    │   │       ├── page.tsx      ← All service records
    │   │       └── new/page.tsx  ← Log new service record
    │   │
    │   └── api/                  ← Backend API endpoints
    │       ├── auth/
    │       │   ├── login/route.ts         ← POST /api/auth/login
    │       │   ├── create-account/route.ts← POST /api/auth/create-account
    │       │   ├── logout/route.ts        ← GET+POST /api/auth/logout
    │       │   ├── me/route.ts            ← GET /api/auth/me
    │       │   └── verify/
    │       │       ├── send-otp/route.ts  ← POST: email OTP bhejo
    │       │       └── verify-otp/route.ts← POST: OTP verify karo
    │       ├── assets/
    │       │   ├── route.ts               ← GET (list) + POST (create)
    │       │   └── [id]/route.ts          ← GET, PUT, DELETE single asset
    │       ├── issues/
    │       │   ├── route.ts               ← GET (list) + POST (report)
    │       │   └── [id]/route.ts          ← GET, PUT, DELETE single issue
    │       ├── service-records/route.ts   ← GET + POST service records
    │       ├── ai/recommend/route.ts      ← POST: Gemini AI diagnosis
    │       ├── dashboard/stats/route.ts   ← GET: dashboard numbers
    │       ├── users/route.ts             ← GET: all users (for assignment)
    │       ├── users/me/route.ts          ← GET: current logged-in user
    │       └── upload/route.ts            ← POST: Cloudinary image upload
    │
    ├── lib/
    │   ├── db/index.ts           ← MongoDB connection
    │   └── models/               ← Database schemas
    │       ├── User.ts           ← User schema
    │       ├── Asset.ts          ← Asset schema
    │       ├── Issue.ts          ← Issue/ticket schema
    │       └── ServiceRecord.ts  ← Service record schema
    │
    ├── middleware.ts              ← Route protection logic
    │
    └── utils/
        ├── jwt/index.ts          ← Token generate/verify
        ├── cloudinary/index.ts   ← Image upload to Cloudinary
        ├── email/send.ts         ← Email bhejne ka utility
        ├── email/templates/      ← Email HTML templates
        ├── getUser/index.ts      ← Cookie se current user nikalna
        └── otpGenerator/index.ts ← Random OTP banana
```

---

# DATABASE MODELS — KYA STORE HOTA HAI?

## 1. USER MODEL (`src/lib/models/User.ts`)

```
User {
  username    → display name (e.g. "Ahmed Raza")
  email       → unique email address
  password    → bcrypt hashed (11 salt rounds)
  role        → "Administrator" | "Supervisor" | "Technician" | "Reporter"
  verify {
    status    → true/false — email verified hai ya nahi
    otp {
      code    → 6-digit OTP code (temporary)
      expireAt→ 10 minutes mein expire
    }
  }
  createdAt, updatedAt
}
```

**4 Roles:**
- **Administrator** → Sab kuch kar sakta hai, system settings
- **Supervisor** → Assets banao, issues assign karo, service records dekho
- **Technician** → Assigned issues dekho, service records log karo
- **Reporter** → Sirf issues report kar sakta hai (dashboard ke through)

---

## 2. ASSET MODEL (`src/lib/models/Asset.ts`)

```
Asset {
  name           → "Server Room AC Unit 1"
  assetTag       → "MIQ-A3F8C2D1" (auto-generated, unique)
  category       → HVAC | Electrical | Plumbing | Fire Safety | IT Equipment
                   | Furniture | Vehicle | Medical Equipment | Kitchen Equipment | Other
  location {
    building     → "Block A"
    floor        → "2nd Floor"
    room         → "Room 204"
  }
  description    → "1.5 ton Daikin inverter AC..."
  manufacturer   → "Daikin"
  model          → "FTKF50TV"
  serialNumber   → "SN-847293"
  purchaseDate   → Date
  warrantyExpiry → Date
  status         → "operational" | "under_maintenance" | "faulty" | "decommissioned"
  imageUrl       → Cloudinary image URL
  qrCodeUrl      → Cloudinary QR code image URL
  createdBy      → User ObjectId (ref)
  organization   → "IT Department" (text field — NOT a separate Organization model)
  nextServiceDate→ Date (next preventive maintenance)
  lastServiceDate→ Date (last time serviced)
  createdAt, updatedAt
}
```

**Important:** `assetTag` auto-generate hota hai format `MIQ-XXXXXXXX` (UUID se). Yahi tag QR code mein bhi hota hai.

---

## 3. ISSUE MODEL (`src/lib/models/Issue.ts`)

```
Issue {
  asset        → Asset ObjectId (ref) — kaunsa asset mein masla hai
  title        → "AC not cooling properly"
  description  → Detail mein kya masla hai
  priority     → "low" | "medium" | "high" | "critical"
  status       → "open" → "assigned" → "in_progress" → "resolved" → "closed"
  reportedBy {
    userId     → User ObjectId (agar logged-in hai to)
    name       → "Anonymous" (agar QR se report kiya)
    email      → reporter ka email
    phone      → reporter ka phone
  }
  assignedTo   → User ObjectId (Technician) — supervisor assign karta hai
  imageUrl     → Cloudinary URL (reporter ne photo upload ki)
  aiSuggestion → Gemini AI ka response (root cause + fix steps)
  resolutionNotes → Technician ne kya kiya
  resolvedAt   → kab resolve hua
  estimatedCompletionDate → target date
  createdAt, updatedAt
}
```

---

## 4. SERVICE RECORD MODEL (`src/lib/models/ServiceRecord.ts`)

```
ServiceRecord {
  asset         → Asset ObjectId (ref)
  issue         → Issue ObjectId (ref) — optional, linked ticket
  serviceType   → "repair" | "preventive" | "inspection" | "replacement" | "upgrade"
  title         → "Replaced compressor unit"
  description   → detail kya kiya
  performedBy   → User ObjectId (Technician)
  cost          → 5000 (PKR amount)
  partsReplaced → ["Air filter", "Fan belt", "Thermostat"]
  beforeImageUrl→ Cloudinary URL
  afterImageUrl → Cloudinary URL
  nextServiceDate→ Date (agli preventive service kab karni hai)
  duration      → 90 (minutes mein)
  status        → "completed" | "partial" | "pending"
  createdAt, updatedAt
}
```

---

# API ROUTES — KYA KYA KAAM KARTE HAIN?

## AUTH APIs

| Method | Endpoint | Kya Karta Hai |
|--------|----------|---------------|
| POST | `/api/auth/create-account` | Naya account banao (username, email, password, role) |
| POST | `/api/auth/login` | Login karo → `token` cookie set hoti hai (7 din valid) |
| POST/GET | `/api/auth/logout` | Logout → `token` cookie delete hoti hai |
| GET | `/api/auth/me` | Apni profile nikalo (token se) |
| POST | `/api/auth/verify/send-otp` | Email pe 6-digit OTP bhejo (10 min valid) |
| POST | `/api/auth/verify/verify-otp` | OTP verify karo → account verified ho jaata hai |

## ASSET APIs

| Method | Endpoint | Kya Karta Hai |
|--------|----------|---------------|
| GET | `/api/assets?search=&category=&status=` | Sab assets list (filter support) |
| POST | `/api/assets` | Naya asset banao → **auto QR generate + Cloudinary upload** |
| GET | `/api/assets/[id]` | Single asset detail + uske issues + service records |
| PUT | `/api/assets/[id]` | Asset update karo (status, details etc.) |
| DELETE | `/api/assets/[id]` | Asset delete karo |

## ISSUE APIs

| Method | Endpoint | Kya Karta Hai |
|--------|----------|---------------|
| GET | `/api/issues?status=&priority=&asset=` | Sab issues list |
| POST | `/api/issues` | Naya issue report karo (**public — no login needed**) |
| GET | `/api/issues/[id]` | Single issue detail |
| PUT | `/api/issues/[id]` | Issue update (assign, status change, notes) |
| DELETE | `/api/issues/[id]` | Issue delete |

## SERVICE RECORDS APIs

| Method | Endpoint | Kya Karta Hai |
|--------|----------|---------------|
| GET | `/api/service-records?asset=` | Sab service records (filter by asset) |
| POST | `/api/service-records` | Naya service record log karo |

## OTHER APIs

| Method | Endpoint | Kya Karta Hai |
|--------|----------|---------------|
| POST | `/api/ai/recommend` | Gemini AI se maintenance diagnosis lo |
| GET | `/api/dashboard/stats` | Dashboard ke saare numbers + chart data |
| GET | `/api/users` | Sab users list (technician assign ke liye) |
| GET | `/api/users/me` | Current user info |
| POST | `/api/upload` | Image base64 → Cloudinary upload |

---

# MIDDLEWARE — ROUTE GUARD KAISE KAAM KARTA HAI?

`src/middleware.ts` har request se pehle chalta hai.

```
Har request aai
    ↓
Kya yeh /_next/* ya static file hai? → Allow
    ↓
Kya yeh public page hai? (/, /auth/*) → Allow
    ↓
Kya yeh /asset/*/public hai? → Allow (QR scan page)
    ↓
Kya yeh public API hai? (/api/auth/*, /api/issues, /api/assets/) → Allow
    ↓
Token cookie exist karti hai? 
  → Nahi: /dashboard/* → redirect to /auth/login
  → Nahi: /api/* → 401 JSON return
  → Haan: Request allow karo (actual token verify API route mein hoti hai)
```

**WHY Token verify middleware mein nahi:**
Next.js middleware **Edge Runtime** pe chalta hai (browser jaisa environment). `jsonwebtoken.verify()` ko Node.js ka `crypto` module chahiye jo Edge Runtime mein available nahi. Isliye middleware sirf cookie exist check karta hai — actual verify `getCurrentUser()` function mein hoti hai jo Node.js runtime mein chalta hai.

---

# FREE APIS — KAHAN SE KAISE LENI HAIN?

## 1. Google Gemini AI (Maintenance Diagnosis)
- **Kya karta hai:** Issue report karne ke baad AI root cause batata hai, repair steps, preventive recommendations, estimated time
- **Free tier:** 15 requests/minute, 1,000,000 tokens/day — hackathon ke liye kaafi
- **Key kahan se leni hai:**
  1. https://aistudio.google.com/app/apikey pe jao
  2. Google account se sign in karo
  3. "Create API Key" click karo
  4. `.env` mein paste karo: `GEMINI_API_KEY=AIza...`
- **Agar key nahi hai:** Smart fallback engine automatically kaam karta hai — HVAC, Electrical, Plumbing, IT ke liye pre-written detailed responses deta hai

## 2. Cloudinary (Image + QR Storage)
- **Kya karta hai:** Asset images, issue photos, QR code images permanently store karta hai
- **Already configured** in `.env`:
  ```
  CLOUDINARY_CLOUD_NAME=dhu8yid4o
  CLOUDINARY_API_KEY=475317365872699
  CLOUDINARY_API_SECRET=MJQGnbA930taQq0ytUJ7ugjG0CA
  ```
- **Free tier:** 25 GB storage, 25 GB bandwidth per month

## 3. MongoDB Atlas (Database)
- **Already configured** in `.env`: `MONGODB_URI=mongodb+srv://...`
- **Free tier:** 512 MB storage (M0 cluster) — hackathon ke liye kaafi

## 4. Email SMTP (OTP verification)
- **Already configured** in `.env`:
  ```
  EMAIL_USER=mail@abdulrehman.sbs
  EMAIL_PASS=dffz-25tz-miin-jq2d
  ```
- Custom domain SMTP use kar raha hai Nodemailer ke saath

---

# AUTHENTICATION FLOW — LOGIN KAISE KAAM KARTA HAI?

```
1. User form submit karta hai (email + password)
        ↓
2. POST /api/auth/login
        ↓
3. MongoDB mein email search (case-insensitive)
        ↓
4. bcrypt.compare(input_password, stored_hashed_password)
        ↓
5. Match hone par: generateToken({ id: user._id })
        ↓
6. JWT token generate hota hai (JWT_SECRET se sign)
        ↓
7. "token" naam ki httpOnly cookie set hoti hai (7 din valid)
        ↓
8. Response mein user info aati hai (without password)
        ↓
9. Login page: window.location.href = "/dashboard"
   (window.location use karte hain NOT router.push — 
    taake browser hard navigation kare aur cookie properly bheje)
        ↓
10. Middleware cookie check karta hai → allow
        ↓
11. Dashboard load hota hai
        ↓
12. Dashboard layout /api/auth/me call karta hai
        ↓
13. getCurrentUser() cookie se token nikalta hai,
    decodeToken() se user ID nikalta hai,
    MongoDB se user find karta hai
        ↓
14. User data show hota hai sidebar mein
```

---

# QR CODE FLOW — SABA SE IMPORTANT FEATURE

```
ADMIN SIDE:
1. Supervisor /dashboard/assets/new se naya asset banata hai
        ↓
2. POST /api/assets — server side:
   - Unique assetTag generate: "MIQ-A3F8C2D1"
   - QR code banata hai jo yeh URL encode karta hai:
     "http://localhost:3000/asset/MIQ-A3F8C2D1/public"
   - QR code (base64 PNG) → Cloudinary upload
   - Asset MongoDB mein save → qrCodeUrl field mein Cloudinary URL
        ↓
3. Admin QR code download karta hai
        ↓
4. Physical asset par print karke chipkata hai

PUBLIC SIDE (Reporter):
5. Student/staff QR code scan karta hai phone se
        ↓
6. /asset/MIQ-A3F8C2D1/public page khulta hai (NO LOGIN NEEDED)
        ↓
7. Page pe dikhta hai:
   - Asset ka naam, category, location, status
   - Active issues (agar koi already open hai)
        ↓
8. "Report an Issue" button click karta hai
        ↓
9. Form bharata hai:
   - Title, Description, Priority
   - Photo upload (camera se live ya gallery se)
   - Optional: apna naam, email, phone
        ↓
10. POST /api/issues — anonymous report
    Image → Cloudinary upload → URL save
        ↓
11. Issue MongoDB mein "open" status se save

DASHBOARD SIDE:
12. Supervisor dashboard pe ata hai → Issues mein naya ticket dikhai deta hai
        ↓
13. Issue click karta hai → /dashboard/issues/[id]
        ↓
14. "Get AI Diagnosis" click karta hai
        ↓
15. POST /api/ai/recommend → Gemini API call
    Returns: Root cause, Action steps, Preventive recommendations, Priority
        ↓
16. Supervisor technician assign karta hai (dropdown se)
    Status "assigned" ho jaata hai
        ↓
17. Technician login karta hai → apna assigned issue dekhta hai
        ↓
18. Kaam karta hai, "Log Service Record" click karta hai
        ↓
19. POST /api/service-records:
    - Parts replaced, cost, duration, photos
    - Issue automatically "resolved" ho jaata hai
    - Asset ka lastServiceDate update hota hai
        ↓
20. Permanent service history ban jaati hai
```

---

# DASHBOARD — KYA KYA DIKHTA HAI?

## Stats Cards (4 boxes):
1. **Asset Register** → Total assets + breakdown (operational/maintenance/faulty)
2. **Open Tickets** → Active issues count + critical count
3. **Service Logs** → Total service records logged
4. **Active Staff** → Total Technician role users

## Charts:
1. **Bar Chart** → Issues by priority (Low/Medium/High/Critical)
2. **Pie Chart** → Assets by category (HVAC/Electrical/Plumbing etc.)

## Recent Issues Table:
- Last 5 issues with asset name, priority badge, status, timestamp
- Direct link to each issue

---

# INSTALLED PACKAGES — KYA KYA USE HO RAHA HAI?

| Package | Version | Kyon Use Ho Raha Hai |
|---------|---------|----------------------|
| `next` | 16.2.10 | Main framework — routing, API, SSR |
| `react` | 19.2.4 | UI library |
| `mongoose` | 9.7.4 | MongoDB ODM — models aur queries |
| `bcrypt` | 6.0.0 | Password hashing (11 salt rounds) |
| `jsonwebtoken` | 9.0.3 | JWT token generate aur verify |
| `nodemailer` | 9.0.3 | Email bhejne ke liye |
| `qrcode` | 1.5.4 | QR code PNG generate karna |
| `cloudinary` | 2.10.0 | Image cloud storage |
| `uuid` | 10.0.0 | Random unique assetTag generate |
| `lucide-react` | 1.24.0 | Saare icons (Wrench, QrCode, etc.) |
| `react-hot-toast` | 2.6.0 | Toast notifications |
| `recharts` | 3.9.2 | Dashboard bar chart + pie chart |
| `tailwindcss` | 4 | CSS framework (all styling) |
| `typescript` | 5 | Type safety |

---

# ENV VARIABLES — KYA KYA CHAHIYE?

```env
# MongoDB (already set)
MONGODB_URI=mongodb+srv://...

# JWT Secret (already set — strong random string)
JWT_SECRET=6add39211360fb...

# Email SMTP (already set)
EMAIL_USER=mail@abdulrehman.sbs
EMAIL_PASS=dffz-25tz-miin-jq2d

# Cloudinary (already set)
CLOUDINARY_CLOUD_NAME=dhu8yid4o
CLOUDINARY_API_KEY=475317365872699
CLOUDINARY_API_SECRET=MJQGnbA930taQq0ytUJ7ugjG0CA

# Gemini AI — ABHI LAGANI HAI
GEMINI_API_KEY=AIza...  ← aistudio.google.com/app/apikey se lo

# Base URL — locally localhost, Vercel pe change karo
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

# DEPLOY KAISE KARNA HAI VERCEL PE?

```
Step 1: GitHub pe push karo
git init (agar already nahi)
git add .
git commit -m "MaintainIQ Hackathon Final"
git remote add origin https://github.com/username/maintainiq.git
git push -u origin main

Step 2: vercel.com pe jao
→ "New Project"
→ GitHub repo select karo
→ "Import"

Step 3: Environment Variables add karo
Vercel dashboard → Settings → Environment Variables → Add karo sari values

Step 4: IMPORTANT — NEXT_PUBLIC_BASE_URL update karo
Deploy hone ke baad Vercel ne jo URL diya (e.g. https://maintainiq.vercel.app)
woh .env mein NEXT_PUBLIC_BASE_URL mein daalo
Phir redeploy karo

Kyon? QR codes mein yeh URL encode hoti hai. Agar galat URL hai toh QR scan
karne par wrong page khulega.
```

---

# COMMON ERRORS AUR UNKE SOLUTIONS

## 1. Login ke baad dashboard redirect ho raha hai auth par
**Cause:** `jsonwebtoken` Edge Runtime mein kaam nahi karta
**Fix (already done):** middleware.ts mein token verify nahi, sirf existence check hai

## 2. QR code image nahi dikh rahi
**Cause:** `next.config.ts` mein Cloudinary domain allow nahi tha
**Fix (already done):** `res.cloudinary.com` allowed hai

## 3. Image upload fail ho rahi hai
**Cause:** Cloudinary credentials galat ya missing
**Check:** `.env` mein CLOUDINARY_* variables sahi hain

## 4. AI recommendation nahi aa rahi
**Cause:** GEMINI_API_KEY missing ya wrong
**Fix:** aistudio.google.com se key lo aur .env mein daalo
**Note:** Bina key ke bhi smart fallback kaam karta hai

## 5. Email OTP nahi aa raha
**Cause:** SMTP credentials issue ya email provider block
**Temporary fix:** /auth/verify-email par jao, login karke dashboard directly kholne ki koshish karo — email verification optional hai abhi

## 6. npm install fail ho raha hai (ECONNRESET)
**Cause:** npm registry blocked ya slow
**Fix:** `npm config set registry https://registry.npmmirror.com` phir install karo

---

# DEMO SCRIPT (HACKATHON KE LIE)

```
1. Landing page dikhao (/) — professional design, features explain
   "Yeh MaintainIQ hai — physical assets ka digital identity platform"

2. Register karo — role: Supervisor
   /auth/register → email verify → login

3. Dashboard dikhao
   "Yahan sab stats hain — assets, tickets, service records"

4. Pehla Asset banao
   /dashboard/assets/new
   → Name: "Server Room AC Unit"
   → Category: HVAC
   → Location: Block A / 2nd Floor / Room 204
   → Save → QR code auto-generate ho jaata hai

5. Asset detail dikhao
   QR code download karo ya print preview dikhao
   "Yeh QR code physical AC par chipka dete hain"

6. Public page dikhao (phone se kholo ya new tab)
   /asset/MIQ-XXXXX/public
   → "Yeh wo page hai jo QR scan pe khulta hai — NO LOGIN NEEDED"
   → Issue report karo: "AC not cooling, making noise"
   → Photo upload karo
   → Submit

7. Dashboard wapas jao — Issues tab
   "Naya ticket aa gaya — anonymous report"
   Issue click karo

8. AI Diagnosis click karo
   "Gemini AI ne analyze kiya — root cause, repair steps, estimated time"

9. Technician assign karo (pehle ek Technician account bhi register karo)
   Status: "Assigned"

10. Service Record log karo
    /dashboard/service-history/new
    → Parts replaced: ["Air filter", "Refrigerant refill"]
    → Cost: 5000
    → Save → Issue automatically resolved!

11. Service History dikhao
    "Permanent record ban gaya — kabhi delete nahi hoga"

12. Dashboard wapas — charts updated!
```

---

# SUMMARY — EK NAZAR MEIN

```
TECHNOLOGY STACK:
Frontend  → Next.js 16 + React 19 + Tailwind CSS 4
Backend   → Next.js API Routes (same codebase)
Database  → MongoDB Atlas (mongoose ODM)
Auth      → JWT tokens (httpOnly cookies, 7 day expiry)
Images    → Cloudinary (QR codes + asset photos + issue photos)
Email     → Nodemailer (custom SMTP)
AI        → Google Gemini 1.5 Flash (free tier)
Charts    → Recharts
Icons     → Lucide React

DEPLOYMENT:
Platform  → Vercel (free tier, single deployment)
DB        → MongoDB Atlas M0 (free)
Images    → Cloudinary free tier

USERS:
Administrator → Full access
Supervisor    → Asset management + issue triage + assignment
Technician    → View assigned issues + log service records
Reporter      → Submit tickets (dashboard se)
Anonymous     → Submit tickets (QR scan se — no account needed)

MULTI-TENANCY:
Current → Single tenant (sab ka data ek jagah)
Future  → Organization model add karke multi-tenant ho sakta hai
```

---

*Prepared for Saylani Welfare Trust Hackathon Batch-17*
*Stack: Next.js 15 · MongoDB · Cloudinary · Google Gemini · Tailwind CSS · Recharts*
