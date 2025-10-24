export const BettingPoolABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "poolId", "type": "uint256"},
      {"internalType": "enum BettingPool.BetSide", "name": "side", "type": "uint8"}
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "poolId", "type": "uint256"},
      {"internalType": "enum BettingPool.Resolution", "name": "resolution", "type": "uint8"}
    ],
    "name": "resolvePool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "poolId", "type": "uint256"}],
    "name": "getPoolInfo",
    "outputs": [
      {"internalType": "uint256", "name": "totalAmountA", "type": "uint256"},
      {"internalType": "uint256", "name": "totalAmountB", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBetsA", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBetsB", "type": "uint256"},
      {"internalType": "enum BettingPool.Resolution", "name": "resolution", "type": "uint8"},
      {"internalType": "bool", "name": "resolved", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "poolId", "type": "uint256"},
      {"internalType": "address", "name": "bettor", "type": "address"}
    ],
    "name": "getBetInfo",
    "outputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "enum BettingPool.BetSide", "name": "side", "type": "uint8"},
      {"internalType": "bool", "name": "claimed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// TODO: Deploy contract to Base Sepolia and update this address
export const BETTING_POOL_ADDRESS = "0x6160C6e7c21a97d17323397598Aca532Aa8939C3" as const
