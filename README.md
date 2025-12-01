# Prediction.Live Platform

**Don't watch e-sport. Predict it.**

Prediction.Live is a decentralized prediction market platform that allows users to bet on esports streams in real-time. This platform combines live streaming integration, Web3 authentication, and blockchain-based betting pools to create an engaging prediction experience.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Key Features & Components](#key-features--components)
- [Database Schema](#database-schema)
- [Web3 Integration](#web3-integration)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

### Core Functionality

- **Live Stream Integration**: Connect and display live streams from platforms like Twitch
- **Real-time Prediction Markets**: Create and participate in prediction markets tied to live streams
- **Web3 Authentication**: Seamless wallet connection using Web3Auth with multiple authentication methods (social logins, external wallets like MetaMask, Rabby, etc.)
- **Blockchain Betting**: Place bets on prediction markets using smart contracts on Chiliz Testnet
- **User Profiles**: Complete user profiles with XP, levels, ranks, and achievements
- **Leaderboards**: Ranking system with XP-based progression and tiered ranks (Bronze, Silver, Gold, Diamond)
- **Stream Following**: Follow your favorite streams and get personalized content
- **Real-time Updates**: Live updates via Supabase realtime subscriptions for bets, markets, and results
- **Achievement System**: Unlock achievements across multiple categories (onboarding, volume, precision, momentum, diversity, timing, stream, social, resilience, obsidian)
- **Lootbox System**: Earn and open lootboxes with cosmetic rewards and XP

### User Experience

- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui components
- **Dark Mode**: Optimized dark theme for extended viewing
- **Real-time Status**: Live stream status checking and automatic refresh
- **Betting Interface**: Intuitive betting modals with transaction management
- **Balance Display**: Real-time wallet balance tracking with auto-refresh
- **Transaction Management**: Comprehensive error handling and transaction status tracking
- **External Wallet Support**: Support for MetaMask, Rabby, and other external wallets
- **Profile Creation**: Automatic profile creation and wallet detection

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router and Turbopack
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Charting library for analytics
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database

- **Supabase** - Backend-as-a-Service (PostgreSQL database, authentication, realtime)
- **PostgreSQL** - Relational database (via Supabase)
- **Supabase Realtime** - Real-time subscriptions for live updates

### Web3 & Blockchain

- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **Web3Auth** - Web3 authentication infrastructure with social logins
- **Chiliz Testnet** - EVM-compatible blockchain for smart contracts (Chain ID: 88882)
- **Base Sepolia** - Alternative testnet support (backwards compatibility)

### Smart Contracts

- **Solidity** - Ethereum smart contract language
- **BettingPool.sol** - Main betting pool contract with fee mechanism (5% fee)

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Turbopack** - Fast bundler for development
- **pnpm** - Fast, disk space efficient package manager

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **pnpm** (recommended) or npm
- **Git**
- A **Supabase** account and project
- A **Web3Auth** account and client ID
- A wallet (MetaMask, Rabby, or similar) for Web3 interactions
- Access to **Chiliz Testnet** (or Base Sepolia for backwards compatibility)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd prediction-live-platform
```

2. **Install dependencies**

```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Web3Auth
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Network Configuration (Chiliz Testnet is default)
NEXT_PUBLIC_CHAIN_ID=88882

# Optional: Vercel deployment URL
VERCEL_URL=your_vercel_url
```

4. **Set up Supabase database**

Run the database migrations to create the necessary tables. The schema includes:
- `profiles` - User profiles with XP, wallet addresses, and Web3Auth IDs
- `streams` - Stream information (platform, name)
- `markets` - Prediction markets with questions, answers, and timing
- `bets` - User bets with amounts, sides, and status
- `achievements` - Achievement definitions
- `user_achievements` - User achievement unlocks
- `cosmetics` - Cosmetic items for lootboxes
- `lootboxes` - Lootbox system with rewards
- `stream_follows` - Stream following relationships

5. **Deploy smart contracts**

Deploy the `BettingPool.sol` contract to Chiliz Testnet (or your preferred network) and update the contract address in your configuration.

## Configuration

### Web3Auth Setup

1. Create an account at [Web3Auth](https://web3auth.io/)
2. Create a new project
3. Copy your Client ID to `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
4. Configure allowed domains in Web3Auth dashboard
5. Enable social logins and external wallet providers as needed

### Supabase Setup

1. Create a project at [Supabase](https://supabase.com/)
2. Copy your project URL and anon key
3. Set up Row Level Security (RLS) policies as needed
4. Enable Realtime for tables that need live updates:
   - `bets` - For real-time bet updates
   - `markets` - For market status changes
   - `profiles` - For profile updates

### Chain Configuration

The default chain is **Chiliz Testnet** (Chain ID: 88882). To change it, modify `lib/chains.ts`:

```typescript
export const chilizTestnet = defineChain({
  id: 88882,
  name: 'Chiliz Testnet',
  // ... configuration
})
```

The application also supports Base Sepolia for backwards compatibility.

### Wagmi Configuration

Wagmi is configured in `lib/wagmi.ts` to use Chiliz Testnet by default. The configuration includes:
- Chain definitions
- RPC endpoints
- Block explorers

## Project Structure

```
prediction-live-platform/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   └── auth/
│   │       └── sync-user/    # User synchronization endpoint
│   ├── dashboard/            # Dashboard page
│   ├── following/            # Following page
│   ├── profile/              # User profile page
│   ├── profiles/             # Public profiles
│   │   └── [username]/       # Dynamic profile routes
│   │       └── achievements/ # User achievements page
│   ├── ranking/              # Leaderboard/ranking page
│   ├── streams/              # Stream pages
│   │   ├── [platform]/       # Platform-specific routes
│   │   │   └── [name]/       # Individual stream pages
│   │   │       ├── admin/    # Admin pages for market resolution
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   └── create/           # Stream creation
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── betting/             # Betting-related components
│   │   ├── BetFormModal.tsx
│   │   ├── MarketCreationModal.tsx
│   │   ├── MarketDisplay.tsx
│   │   └── MarketEditModal.tsx
│   ├── forms/               # Form components
│   ├── ui/                  # shadcn/ui components
│   ├── Web3AuthProvider.tsx # Web3Auth context
│   ├── Web3AuthAutoSync.tsx # Auto-sync component
│   └── ...
├── contracts/               # Smart contracts
│   └── BettingPool.sol     # Main betting contract
├── hooks/                  # Custom React hooks
│   ├── useBetChannel.tsx   # Real-time bet updates
│   ├── usePlatformStatus.ts # Stream status checking
│   ├── useWeb3AuthSync.ts  # Web3Auth synchronization
│   └── use-mobile.tsx       # Mobile detection
├── lib/                    # Utility libraries
│   ├── betting/            # Betting service logic
│   │   ├── bettingService.ts
│   │   ├── calculateWinnings.ts
│   │   ├── errorHandling.ts
│   │   └── validation.ts
│   ├── bets/               # Bet CRUD operations
│   │   ├── insert.ts
│   │   ├── insertClient.ts
│   │   ├── select.ts
│   │   └── selectClient.ts
│   ├── markets/            # Market utilities
│   │   ├── selectClient.ts
│   │   └── utils.ts
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   ├── web3/               # Web3 utilities
│   │   └── transactionService.ts
│   ├── chains.ts           # Chain configurations
│   ├── wagmi.ts            # Wagmi configuration
│   ├── web3auth.ts         # Web3Auth configuration
│   ├── rankUtils.tsx       # Ranking calculations
│   ├── timezoneUtils.ts    # Timezone utilities
│   └── ...
├── providers/              # React context providers
│   ├── BettingProvider.tsx
│   ├── ProfileProvider.tsx
│   ├── StreamProvider.tsx
│   └── StreamFollowsProvider.tsx
├── public/                 # Static assets
│   ├── categories/         # Game category images
│   └── logos/             # Brand assets
├── database.types.ts       # Supabase generated types
├── middleware.ts          # Next.js middleware
└── package.json          # Dependencies
```

## Key Features & Components

### Betting System

The betting system allows users to place bets on prediction markets:

- **Market Creation**: Stream admins can create prediction markets with two answer options
- **Bet Placement**: Users can bet on either answer with CHZ (or ETH on Base Sepolia)
- **Real-time Updates**: Live updates of bet amounts and market status via Supabase Realtime
- **Smart Contract Integration**: All bets are recorded on-chain via the BettingPool contract
- **Automatic Payouts**: Winners receive payouts based on the pool distribution
- **Fee System**: 5% fee on winnings collected by the contract

**Key Files:**
- `components/betting/MarketDisplay.tsx` - Market display component with timer
- `components/betting/BetFormModal.tsx` - Betting interface
- `lib/betting/bettingService.ts` - Betting business logic
- `lib/web3/transactionService.ts` - Transaction handling
- `lib/betting/calculateWinnings.ts` - Winnings calculation
- `lib/betting/errorHandling.ts` - Error handling and user messages

### User Profiles & Ranking

Users earn XP through various activities and progress through ranks:

- **XP System**: Earn XP by placing bets, winning predictions, unlocking achievements
- **Level System**: Levels based on total XP accumulation
- **Rank Tiers**: Bronze → Silver → Gold → Diamond with visual indicators
- **Achievements**: Unlock achievements across 10 categories
- **Leaderboard**: Global ranking of all users sorted by rank, level, and XP
- **Profile Pages**: Public profile pages with achievements display

**Key Files:**
- `app/ranking/page.tsx` - Ranking page with leaderboard
- `lib/rankUtils.tsx` - Rank calculation utilities
- `app/profiles/[username]/page.tsx` - User profile pages
- `app/profiles/[username]/achievements/page.tsx` - Achievements display

### Stream Integration

The platform integrates with streaming platforms to show live content:

- **Stream Status**: Real-time checking of stream online/offline status
- **Stream Following**: Follow streams to get personalized content
- **Stream Pages**: Dedicated pages for each stream with embedded player
- **Market Creation**: Create prediction markets tied to specific streams
- **Admin Features**: Stream admins can resolve markets and manage content

**Key Files:**
- `app/streams/page.tsx` - Stream listing
- `app/streams/[platform]/[name]/page.tsx` - Individual stream page
- `hooks/usePlatformStatus.ts` - Stream status hook
- `app/streams/[platform]/[name]/admin/page.tsx` - Admin market resolution

### Web3 Authentication

Web3Auth provides multiple authentication methods:

- **Social Logins**: Google, Twitter, Discord, etc.
- **External Wallets**: Direct connection to MetaMask, Rabby, and other wallets
- **Auto-sync**: Automatic synchronization between Web3Auth and Supabase
- **Multi-chain**: Support for multiple blockchain networks
- **Profile Creation**: Automatic profile creation on first login
- **Wallet Detection**: Automatic detection of connected wallets

**Key Files:**
- `components/Web3AuthProvider.tsx` - Web3Auth context provider
- `components/Web3AuthAutoSync.tsx` - Auto-sync component
- `hooks/useWeb3AuthSync.ts` - Sync hook
- `lib/web3auth.ts` - Web3Auth configuration
- `app/api/auth/sync-user/route.ts` - User synchronization API endpoint

### Real-time Updates

The platform uses Supabase Realtime for live updates:

- **Bet Updates**: Real-time bet placement notifications
- **Market Updates**: Live market status and amount changes
- **Result Announcements**: Instant market resolution notifications
- **Balance Refresh**: Automatic balance updates after transactions

**Key Files:**
- `hooks/useBetChannel.tsx` - Real-time bet channel subscription
- `lib/realtimeTopic.ts` - Realtime topic definitions

## Database Schema

### Core Tables

- **profiles**: User profile information
  - `id`, `username`, `display_name`, `picture_url`
  - `web3auth_id`, `email`, `wallet_address`
  - `xp`, `current_chain_id`
  - `created_at`, `updated_at`

- **streams**: Stream information
  - `id`, `platform`, `name`
  - `created_at`, `updated_at`

- **markets**: Prediction markets
  - `id`, `question`, `answer_a`, `answer_b`
  - `start_time`, `est_end_time`, `real_end_time`
  - `duration`, `status`, `stream_id`
  - `is_answer_a` (resolution)
  - `created_at`, `updated_at`

- **bets**: User bets
  - `id`, `profile_id`, `market_id`
  - `is_answer_a`, `amount`, `exit_amount`
  - `status` (draft, pending, confirmed, resolved, cancelled)
  - `created_at`, `updated_at`

- **achievements**: Achievement definitions
  - `id`, `name`, `description`, `icon`
  - `category`, `requirement`

- **user_achievements**: User achievement unlocks
  - `id`, `user_id`, `achievement_id`, `unlocked_at`

- **cosmetics**: Cosmetic items
  - `id`, `name`, `description`, `image_url`
  - `rarity`

- **lootboxes**: Lootbox system
  - `id`, `profile_id`, `cosmetic_id`
  - `type`, `xp_amount`, `opened_at`
  - `created_at`

- **stream_follows**: Stream following relationships
  - `id`, `profile_id`, `stream_id`, `created_at`

## Web3 Integration

### Smart Contract

The `BettingPool` contract handles all on-chain betting:

- **Pool Management**: Tracks total amounts for each side
- **Bet Placement**: Records individual bets
- **Resolution**: Resolves markets and calculates payouts
- **Fee System**: 5% fee on winnings
- **Claiming**: Winners can claim their winnings

**Contract Functions:**
- `placeBet(uint256 poolId, BetSide side)` - Place a bet on a market
- `resolvePool(uint256 poolId, Resolution resolution)` - Resolve a market (owner only)
- `claimWinnings(uint256 poolId)` - Claim winnings for a resolved bet
- `getPool(uint256 poolId)` - Get pool information
- `getBet(uint256 poolId, address bettor)` - Get bet information

### Transaction Flow

1. User creates bet in database (status: `draft`)
2. Transaction is prepared with contract parameters
3. User signs and submits transaction via Web3Auth or external wallet
4. Transaction is confirmed on-chain
5. Bet status updated to `confirmed`
6. Market resolution triggers payout calculation
7. Winners can claim winnings via `claimWinnings()`

### Supported Networks

- **Chiliz Testnet** (Default) - Chain ID: 88882
  - RPC: `https://spicy-rpc.chiliz.com`
  - Explorer: `https://testnet.chiliscan.com/`
  - Native Currency: CHZ

- **Base Sepolia** (Backwards compatibility - Chain ID: 84532)
  - RPC: `https://sepolia.base.org`
  - Explorer: `https://sepolia.basescan.org/`
  - Native Currency: ETH

## Development

### Running the Development Server

```bash
pnpm dev
# or
npm run dev
```

This starts the Next.js development server with Turbopack for faster builds. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
# or
npm run build
```

This creates an optimized production build in the `.next` directory.

### Starting Production Server

```bash
pnpm start
# or
npm start
```

### Linting

```bash
pnpm lint
# or
npm run lint
```

### Type Checking

TypeScript is configured to check types during build. For standalone checking:

```bash
npx tsc --noEmit
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
   - `NEXT_PUBLIC_CHAIN_ID`
4. Deploy!

Vercel will automatically detect Next.js and configure build settings. The platform supports automatic deployments on push to the main branch.

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` - Your Web3Auth client ID
- `NEXT_PUBLIC_CHAIN_ID` - Chain ID (88882 for Chiliz Testnet, 84532 for Base Sepolia)
- `VERCEL_URL` - Automatically set by Vercel (optional)

### Database Migrations

Run any pending migrations on your production Supabase instance before deploying.

### Smart Contract Deployment

Ensure your `BettingPool` contract is deployed to the target network and the contract address is configured in your application.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add comments for complex logic
- Write descriptive commit messages
- Follow Next.js and React best practices

### Testing

Before submitting a PR, ensure:
- The code builds without errors
- TypeScript types are correct
- ESLint passes
- The application runs in development mode
- Key features work as expected

## License

This project was built for the Base hackathon. Please check the license file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Acknowledgments

- Built with Next.js, React, and Supabase
- Web3 integration via Web3Auth and Wagmi
- Smart contracts deployed on Chiliz Testnet
- UI components from shadcn/ui

---


Deployment for the Base hackathon, final