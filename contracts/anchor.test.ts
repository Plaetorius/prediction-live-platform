import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BettingPool } from "../target/types/betting_pool";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BettingPoolClient } from "./client";

describe("betting_pool", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BettingPool as Program<BettingPool>;
  const client = new BettingPoolClient(program);

  // Test accounts
  let owner: anchor.web3.Keypair;
  let bettor1: anchor.web3.Keypair;
  let bettor2: anchor.web3.Keypair;
  let feeRecipient: anchor.web3.Keypair;
  const poolId = 1;

  before(async () => {
    // Generate test keypairs
    owner = anchor.web3.Keypair.generate();
    bettor1 = anchor.web3.Keypair.generate();
    bettor2 = anchor.web3.Keypair.generate();
    feeRecipient = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    
    await provider.connection.requestAirdrop(owner.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(bettor1.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(bettor2.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(feeRecipient.publicKey, 1 * LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it("Initialize pool", async () => {
    const tx = await client.initializePool(
      poolId,
      feeRecipient.publicKey,
      owner
    );

    console.log("Initialize pool transaction:", tx);
    
    // Verify pool was created
    const poolInfo = await client.getPoolInfo(poolId);
    expect(poolInfo).not.toBeNull();
    expect(poolInfo.totalAmountA.toNumber()).toBe(0);
    expect(poolInfo.totalAmountB.toNumber()).toBe(0);
    expect(poolInfo.resolved).toBe(false);
  });

  it("Place bet on side A", async () => {
    const betAmount = client.solToLamports(0.1); // 0.1 SOL

    const tx = await client.placeBet(
      poolId,
      { a: {} },
      betAmount,
      bettor1,
      owner.publicKey,
      feeRecipient.publicKey
    );

    console.log("Place bet A transaction:", tx);

    // Verify pool info updated
    const poolInfo = await client.getPoolInfo(poolId);
    expect(poolInfo.totalAmountA.toNumber()).toBe(betAmount);
    expect(poolInfo.totalBetsA.toNumber()).toBe(1);
    expect(poolInfo.totalAmountB.toNumber()).toBe(0);
    expect(poolInfo.totalBetsB.toNumber()).toBe(0);

    // Verify bet info
    const betInfo = await client.getBetInfo(poolId, bettor1.publicKey);
    expect(betInfo.amount.toNumber()).toBe(betAmount);
    expect(betInfo.claimed).toBe(false);
  });

  it("Place bet on side B", async () => {
    const betAmount = client.solToLamports(0.2); // 0.2 SOL

    const tx = await client.placeBet(
      poolId,
      { b: {} },
      betAmount,
      bettor2,
      owner.publicKey,
      feeRecipient.publicKey
    );

    console.log("Place bet B transaction:", tx);

    // Verify pool info updated
    const poolInfo = await client.getPoolInfo(poolId);
    expect(poolInfo.totalAmountA.toNumber()).toBe(client.solToLamports(0.1));
    expect(poolInfo.totalBetsA.toNumber()).toBe(1);
    expect(poolInfo.totalAmountB.toNumber()).toBe(betAmount);
    expect(poolInfo.totalBetsB.toNumber()).toBe(1);

    // Verify bet info
    const betInfo = await client.getBetInfo(poolId, bettor2.publicKey);
    expect(betInfo.amount.toNumber()).toBe(betAmount);
    expect(betInfo.claimed).toBe(false);
  });

  it("Get bettors count", async () => {
    const count = await client.getBettorsCount(poolId);
    expect(count.countA.toNumber()).toBe(1);
    expect(count.countB.toNumber()).toBe(1);
  });

  it("Resolve pool - Side A wins", async () => {
    const tx = await client.resolvePool(
      poolId,
      { a: {} },
      owner,
      feeRecipient.publicKey
    );

    console.log("Resolve pool transaction:", tx);

    // Verify pool is resolved
    const poolInfo = await client.getPoolInfo(poolId);
    expect(poolInfo.resolved).toBe(true);
  });

  it("Claim winnings - Side A winner", async () => {
    const balanceBefore = await program.provider.connection.getBalance(bettor1.publicKey);
    
    const tx = await client.claimWinnings(poolId, bettor1);
    console.log("Claim winnings transaction:", tx);

    const balanceAfter = await program.provider.connection.getBalance(bettor1.publicKey);
    
    // Winner should have more SOL
    expect(balanceAfter).toBeGreaterThan(balanceBefore);
    
    // Verify bet is marked as claimed
    const betInfo = await client.getBetInfo(poolId, bettor1.publicKey);
    expect(betInfo.claimed).toBe(true);
  });

  it("Try to claim winnings - Side B loser", async () => {
    // This should fail because bettor2 is on the losing side
    try {
      await client.claimWinnings(poolId, bettor2);
      expect.fail("Should have failed - bettor2 is on losing side");
    } catch (error) {
      console.log("Expected error for losing bettor:", error.message);
      expect(error.message).toContain("NotWinner");
    }
  });

  it("Get contract balance", async () => {
    const balance = await client.getContractBalance(poolId);
    console.log("Contract balance:", client.lamportsToSol(balance), "SOL");
    expect(balance).toBeGreaterThan(0);
  });

  it("Update fee recipient", async () => {
    const newFeeRecipient = anchor.web3.Keypair.generate();
    
    const tx = await client.updateFeeRecipient(
      poolId,
      newFeeRecipient.publicKey,
      owner
    );

    console.log("Update fee recipient transaction:", tx);

    // Verify fee recipient was updated
    const poolInfo = await client.getPoolInfo(poolId);
    expect(poolInfo.feeRecipient.toString()).toBe(newFeeRecipient.publicKey.toString());
  });

  it("Test auto-initialization on first bet", async () => {
    const newPoolId = 2;
    const betAmount = client.solToLamports(0.05);

    // Place bet without initializing pool first
    const tx = await client.placeBet(
      newPoolId,
      { a: {} },
      betAmount,
      bettor1,
      owner.publicKey,
      feeRecipient.publicKey
    );

    console.log("Auto-initialize pool transaction:", tx);

    // Verify pool was auto-initialized
    const poolInfo = await client.getPoolInfo(newPoolId);
    expect(poolInfo).not.toBeNull();
    expect(poolInfo.totalAmountA.toNumber()).toBe(betAmount);
    expect(poolInfo.totalBetsA.toNumber()).toBe(1);
  });

  it("Test emergency withdraw", async () => {
    const newPoolId = 3;
    
    // Initialize pool and place some bets
    await client.initializePool(newPoolId, feeRecipient.publicKey, owner);
    await client.placeBet(newPoolId, { a: {} }, client.solToLamports(0.1), bettor1, owner.publicKey, feeRecipient.publicKey);
    
    const balanceBefore = await program.provider.connection.getBalance(owner.publicKey);
    
    const tx = await client.emergencyWithdraw(newPoolId, owner);
    console.log("Emergency withdraw transaction:", tx);
    
    const balanceAfter = await program.provider.connection.getBalance(owner.publicKey);
    
    // Owner should have more SOL after emergency withdrawal
    expect(balanceAfter).toBeGreaterThan(balanceBefore);
  });

  it("Test error handling - Place bet on resolved pool", async () => {
    const newPoolId = 4;
    
    // Initialize, place bet, and resolve pool
    await client.initializePool(newPoolId, feeRecipient.publicKey, owner);
    await client.placeBet(newPoolId, { a: {} }, client.solToLamports(0.1), bettor1, owner.publicKey, feeRecipient.publicKey);
    await client.resolvePool(newPoolId, { a: {} }, owner, feeRecipient.publicKey);
    
    // Try to place another bet on resolved pool - should fail
    try {
      await client.placeBet(newPoolId, { b: {} }, client.solToLamports(0.1), bettor2, owner.publicKey, feeRecipient.publicKey);
      expect.fail("Should have failed - pool is resolved");
    } catch (error) {
      console.log("Expected error for resolved pool:", error.message);
      expect(error.message).toContain("PoolAlreadyResolved");
    }
  });

  it("Test error handling - Place multiple bets from same user", async () => {
    const newPoolId = 5;
    
    // Initialize pool
    await client.initializePool(newPoolId, feeRecipient.publicKey, owner);
    
    // Place first bet
    await client.placeBet(newPoolId, { a: {} }, client.solToLamports(0.1), bettor1, owner.publicKey, feeRecipient.publicKey);
    
    // Try to place second bet from same user - should fail
    try {
      await client.placeBet(newPoolId, { b: {} }, client.solToLamports(0.1), bettor1, owner.publicKey, feeRecipient.publicKey);
      expect.fail("Should have failed - user already placed bet");
    } catch (error) {
      console.log("Expected error for duplicate bet:", error.message);
      expect(error.message).toContain("AlreadyPlacedBet");
    }
  });
});
