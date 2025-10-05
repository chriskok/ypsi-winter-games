# YWG MVP - Technical Documentation

## Project Overview

A web-based points game where users find physical codes around Ypsilanti, redeem them for points, and exchange points for prizes. Built for speed and simplicity - launch in 2 weeks with zero budget.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Firebase (Authentication + Firestore)
- **Hosting**: Vercel (free tier)
- **Styling**: Tailwind CSS (keep it simple)

## Core Features

### 1. User Authentication
Users can create accounts and log in to track their points.

**Implementation:**
- Firebase Authentication (Email/Password only for MVP)
- No social logins, no password reset (keep it simple - users can make new accounts)
- Store minimal user data: email, display name, total points, prizes claimed

### 2. Code Redemption System
Users enter codes they find around town to earn points.

**Implementation:**
- Simple text input form
- Codes are uppercase strings (e.g., "DEPOT2024", "FROG42")
- Each code worth 100 points
- One-time use per user (track in Firestore: userId + codeId)
- Instant feedback: "Success! +100 points" or "Already redeemed"

**Firestore Structure:**
```
codes/
  {codeId}/
    value: 100
    active: true
    
redemptions/
  {userId}_{codeId}/
    userId: string
    codeId: string
    timestamp: timestamp
    
users/
  {userId}/
    email: string
    displayName: string
    totalPoints: number
    prizesClaimedCount: number
```

### 3. Point Balance Display
Show users their current points prominently on every page.

**Implementation:**
- Display total points in header/nav
- Show redemption history on profile page (optional for V1)
- Real-time updates when codes are redeemed

### 4. Prize Catalog
Simple list of prizes users can "purchase" with points.

**Implementation:**
- Static prize list (hardcoded in code, not admin-editable)
- Each prize: name, description, point cost, image (optional)
- "Claim Prize" button checks if user has enough points
- Deducts points and increments prizesClaimedCount
- Cap at 4 prizes per user (check before allowing claim)
- No fulfillment system - just log it, handle distribution manually

**Prize Data Structure:**
```javascript
const PRIZES = [
  {
    id: 'sticker',
    name: 'YWG Sticker',
    cost: 500,
    description: 'Cool sticker',
    inStock: true
  },
  {
    id: 'coffee',
    name: 'Beezy\'s Coffee',
    cost: 1000,
    description: '$5 gift card',
    inStock: true
  },
  {
    id: 'grand',
    name: 'Grand Prize T-Shirt',
    cost: 2500,
    description: 'Limited edition',
    inStock: true
  }
]
```

### 5. Basic Leaderboard
Show top 10 players by points (optional for launch, nice to have).

**Implementation:**
- Query Firestore for top 10 users by totalPoints
- Display rank, display name (or anonymous "Player #123"), points
- Update every 5 minutes (no real-time needed)

## What We're NOT Building

- Admin dashboard (manage codes via Firebase console)
- Password reset flow
- Email notifications
- Prize shipping/fulfillment automation
- Mobile app
- Social features
- Badges or achievements
- Complex puzzles or riddles
- Analytics dashboard
- Code generation tool (create codes manually)

## Development Plan

### Phase 1: Core Setup (Days 1-2)
1. Initialize Next.js project with TypeScript
2. Set up Firebase project (Authentication + Firestore)
3. Configure Vercel deployment
4. Create basic layout with Tailwind

### Phase 2: Authentication (Day 3)
1. Build sign up / login pages
2. Implement Firebase Auth
3. Protected routes for authenticated users
4. Basic header with points display

### Phase 3: Code Redemption (Days 4-5)
1. Create code entry page/component
2. Firestore rules for redemption security
3. Add codes to Firestore manually
4. Test redemption flow

### Phase 4: Prize System (Days 6-7)
1. Create prize catalog page
2. Implement claim logic with 4-prize cap
3. Prize confirmation flow
4. Track claimed prizes in Firestore

### Phase 5: Polish & Launch (Days 8-10)
1. Add leaderboard (if time permits)
2. Basic error handling
3. Mobile responsive check
4. Deploy to production
5. Test with friends

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Anyone can read active codes (just existence)
    match /codes/{codeId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only via console
    }
    
    // Users can read their redemptions, write only via valid redemption
    match /redemptions/{redemptionId} {
      allow read: if request.auth != null && 
                     redemptionId.matches(request.auth.uid + '_.*');
      allow create: if request.auth != null && 
                       redemptionId == request.auth.uid + '_' + request.resource.data.codeId;
    }
  }
}
```

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Code Management

For MVP, manually add codes via Firebase Console:

1. Go to Firestore
2. Add documents to `codes` collection
3. Each doc needs: `codeId` (string), `value` (100), `active` (true)

Generate codes simply:
- "DEPOT01", "DEPOT02", etc.
- "FROG01", "WATER01" (landmark-based)
- Keep them memorable and short

## Deployment

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy main branch
4. Every push to main auto-deploys

## Success Metrics (Don't Build, Just Track Manually)

- Number of users who sign up
- Number of codes redeemed
- Which codes are most popular
- How many prizes claimed

Check Firebase console weekly to see these numbers.

## Future Improvements (Post-MVP)

- Reading log feature
- Business partner code hosting
- Admin dashboard for code management
- Better prize fulfillment tracking
- Email notifications
- Profiles with avatars
- Teams or friends features

## Getting Help

- Next.js docs: https://nextjs.org/docs
- Firebase docs: https://firebase.google.com/docs/web/setup
- Vercel deployment: https://vercel.com/docs

## Notes for Claude

When helping build this project:
- Prioritize working code over perfect code
- Use TypeScript for type safety
- Keep components simple and colocated
- Don't over-engineer - this is a 2-week MVP
- Suggest Firebase Emulator for local testing
- Focus on happy path, basic error handling only