// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BettingPool {
    address public owner;
    address public feeRecipient;
    uint256 public constant FEE_PERCENTAGE = 5; // 5% fee
    
    enum BetSide { A, B }
    enum Resolution { Pending, A, B }
    
    struct Bet {
        address bettor;
        uint256 amount;
        BetSide side;
        bool claimed;
    }
    
    struct Pool {
        uint256 totalAmountA;
        uint256 totalAmountB;
        uint256 totalBetsA;
        uint256 totalBetsB;
        Resolution resolution;
        bool resolved;
    }
    
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(uint256 => address[]) public bettorsA;
    mapping(uint256 => address[]) public bettorsB;
    
    event BetPlaced(uint256 indexed poolId, address indexed bettor, BetSide side, uint256 amount);
    event PoolResolved(uint256 indexed poolId, Resolution resolution);
    event WinningsClaimed(uint256 indexed poolId, address indexed bettor, uint256 amount);
    event FeeCollected(uint256 indexed poolId, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier poolExists(uint256 poolId) {
        require(poolId > 0, "Pool does not exist");
        _;
    }
    
    modifier poolNotResolved(uint256 poolId) {
        require(!pools[poolId].resolved, "Pool already resolved");
        _;
    }
    
    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Place a bet on a specific pool
     * @param poolId The ID of the pool to bet on
     * @param side The side to bet on (A or B)
     */
    function placeBet(uint256 poolId, BetSide side) external payable poolExists(poolId) poolNotResolved(poolId) {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(bets[poolId][msg.sender].amount == 0, "Already placed a bet on this pool");
        
        // Create or update bet
        bets[poolId][msg.sender] = Bet({
            bettor: msg.sender,
            amount: msg.value,
            side: side,
            claimed: false
        });
        
        // Update pool totals
        if (side == BetSide.A) {
            pools[poolId].totalAmountA += msg.value;
            pools[poolId].totalBetsA += 1;
            bettorsA[poolId].push(msg.sender);
        } else {
            pools[poolId].totalAmountB += msg.value;
            pools[poolId].totalBetsB += 1;
            bettorsB[poolId].push(msg.sender);
        }
        
        emit BetPlaced(poolId, msg.sender, side, msg.value);
    }
    
    /**
     * @dev Resolve a pool and distribute winnings
     * @param poolId The ID of the pool to resolve
     * @param resolution The winning side (A or B)
     */
    function resolvePool(uint256 poolId, Resolution resolution) external onlyOwner poolExists(poolId) poolNotResolved(poolId) {
        require(resolution == Resolution.A || resolution == Resolution.B, "Invalid resolution");
        
        pools[poolId].resolution = resolution;
        pools[poolId].resolved = true;
        
        emit PoolResolved(poolId, resolution);
        
        // Calculate and distribute winnings
        _distributeWinnings(poolId, resolution);
    }
    
    /**
     * @dev Internal function to distribute winnings to winners
     */
    function _distributeWinnings(uint256 poolId, Resolution resolution) internal {
        Pool storage pool = pools[poolId];
        
        if (resolution == Resolution.A) {
            // Side A wins
            uint256 totalWinnings = pool.totalAmountA + pool.totalAmountB;
            uint256 feeAmount = (totalWinnings * FEE_PERCENTAGE) / 100;
            uint256 winningsToDistribute = totalWinnings - feeAmount;
            
            // Send fee to fee recipient
            if (feeAmount > 0) {
                payable(feeRecipient).transfer(feeAmount);
                emit FeeCollected(poolId, feeAmount);
            }
            
            // Distribute winnings to side A bettors
            if (winningsToDistribute > 0 && pool.totalAmountA > 0) {
                for (uint256 i = 0; i < bettorsA[poolId].length; i++) {
                    address bettor = bettorsA[poolId][i];
                    Bet storage bet = bets[poolId][bettor];
                    
                    if (!bet.claimed) {
                        uint256 bettorWinnings = (bet.amount * winningsToDistribute) / pool.totalAmountA;
                        bet.claimed = true;
                        
                        payable(bettor).transfer(bettorWinnings);
                        emit WinningsClaimed(poolId, bettor, bettorWinnings);
                    }
                }
            }
        } else {
            // Side B wins
            uint256 totalWinnings = pool.totalAmountA + pool.totalAmountB;
            uint256 feeAmount = (totalWinnings * FEE_PERCENTAGE) / 100;
            uint256 winningsToDistribute = totalWinnings - feeAmount;
            
            // Send fee to fee recipient
            if (feeAmount > 0) {
                payable(feeRecipient).transfer(feeAmount);
                emit FeeCollected(poolId, feeAmount);
            }
            
            // Distribute winnings to side B bettors
            if (winningsToDistribute > 0 && pool.totalAmountB > 0) {
                for (uint256 i = 0; i < bettorsB[poolId].length; i++) {
                    address bettor = bettorsB[poolId][i];
                    Bet storage bet = bets[poolId][bettor];
                    
                    if (!bet.claimed) {
                        uint256 bettorWinnings = (bet.amount * winningsToDistribute) / pool.totalAmountB;
                        bet.claimed = true;
                        
                        payable(bettor).transfer(bettorWinnings);
                        emit WinningsClaimed(poolId, bettor, bettorWinnings);
                    }
                }
            }
        }
    }
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (
        uint256 totalAmountA,
        uint256 totalAmountB,
        uint256 totalBetsA,
        uint256 totalBetsB,
        Resolution resolution,
        bool resolved
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.totalAmountA,
            pool.totalAmountB,
            pool.totalBetsA,
            pool.totalBetsB,
            pool.resolution,
            pool.resolved
        );
    }
    
    /**
     * @dev Get bet information for a specific user
     */
    function getBetInfo(uint256 poolId, address bettor) external view returns (
        uint256 amount,
        BetSide side,
        bool claimed
    ) {
        Bet storage bet = bets[poolId][bettor];
        return (bet.amount, bet.side, bet.claimed);
    }
    
    /**
     * @dev Get total number of bettors for each side
     */
    function getBettorsCount(uint256 poolId) external view returns (uint256 countA, uint256 countB) {
        return (bettorsA[poolId].length, bettorsB[poolId].length);
    }
    
    /**
     * @dev Emergency function to withdraw funds (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid address");
        feeRecipient = _newFeeRecipient;
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
