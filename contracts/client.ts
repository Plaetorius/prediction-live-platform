import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BettingPool } from "../target/types/betting_pool";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class BettingPoolClient {
  program: Program<BettingPool>;
  provider: anchor.AnchorProvider;

  constructor(program: Program<BettingPool>) {
    this.program = program;
    this.provider = program.provider as anchor.AnchorProvider;
  }

  // Get pool PDA
  getPoolPDA(poolId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from(poolId.toString().padStart(8, "0"))],
      this.program.programId
    );
  }

  // Get bet PDA
  getBetPDA(poolId: number, bettor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), Buffer.from(poolId.toString().padStart(8, "0")), bettor.toBuffer()],
      this.program.programId
    );
  }

  // Initialize a new pool
  async initializePool(
    poolId: number,
    feeRecipient: PublicKey,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const [poolPDA] = this.getPoolPDA(poolId);

    const tx = await this.program.methods
      .initializePool(new anchor.BN(poolId), feeRecipient)
      .accounts({
        pool: poolPDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("Pool initialized:", tx);
    return tx;
  }

  // Place a bet
  async placeBet(
    poolId: number,
    side: { a: {} } | { b: {} },
    amount: number, // in lamports
    bettor: anchor.web3.Keypair,
    owner: PublicKey,
    feeRecipient: PublicKey
  ): Promise<string> {
    const [poolPDA] = this.getPoolPDA(poolId);
    const [betPDA] = this.getBetPDA(poolId, bettor.publicKey);

    const tx = await this.program.methods
      .placeBet(new anchor.BN(poolId), side, new anchor.BN(amount))
      .accounts({
        pool: poolPDA,
        bet: betPDA,
        bettor: bettor.publicKey,
        owner: owner,
        feeRecipient: feeRecipient,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor])
      .rpc();

    console.log("Bet placed:", tx);
    return tx;
  }

  // Resolve a pool
  async resolvePool(
    poolId: number,
    resolution: { pending: {} } | { a: {} } | { b: {} },
    owner: anchor.web3.Keypair,
    feeRecipient: PublicKey
  ): Promise<string> {
    const [poolPDA] = this.getPoolPDA(poolId);

    const tx = await this.program.methods
      .resolvePool(new anchor.BN(poolId), resolution)
      .accounts({
        pool: poolPDA,
        owner: owner.publicKey,
        feeRecipient: feeRecipient,
      })
      .signers([owner])
      .rpc();

    console.log("Pool resolved:", tx);
    return tx;
  }

  // Claim winnings
  async claimWinnings(
    poolId: number,
    bettor: anchor.web3.Keypair
  ): Promise<string> {
    const [poolPDA] = this.getPoolPDA(poolId);
    const [betPDA] = this.getBetPDA(poolId, bettor.publicKey);

    const tx = await this.program.methods
      .claimWinnings(new anchor.BN(poolId))
      .accounts({
        pool: poolPDA,
        bet: betPDA,
        bettor: bettor.publicKey,
      })
      .signers([bettor])
      .rpc();

    console.log("Winnings claimed:", tx);
    return tx;
  }

  // Get pool info
  async getPoolInfo(poolId: number): Promise<any> {
    const [poolPDA] = this.getPoolPDA(poolId);

    try {
      const poolInfo = await this.program.methods
        .getPoolInfo(new anchor.BN(poolId))
        .accounts({
          pool: poolPDA,
        })
        .view();

      return poolInfo;
    } catch (error) {
      console.log("Pool not found or not initialized");
      return null;
    }
  }

  // Get bet info
  async getBetInfo(poolId: number, bettor: PublicKey): Promise<any> {
    const [poolPDA] = this.getPoolPDA(poolId);
    const [betPDA] = this.getBetPDA(poolId, bettor);

    try {
      const betInfo = await this.program.methods
        .getBetInfo(new anchor.BN(poolId))
        .accounts({
          pool: poolPDA,
          bet: betPDA,
          bettor: bettor,
        })
        .view();

      return betInfo;
    } catch (error) {
      console.log("Bet not found");
      return null;
    }
  }

  // Get bettors count
  async getBettorsCount(poolId: number): Promise<any> {
    const [poolPDA] = this.getPoolPDA(poolId);

    try {
      const count = await this.program.methods
        .getBettorsCount(new anchor.BN(poolId))
        .accounts({
          pool: poolPDA,
        })
        .view();

      return count;
    } catch (error) {
      console.log("Pool not found");
      return null;
    }
  }

  // Emergency withdraw
  async emergencyWithdraw(
    poolId: number,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const [poolPDA] = this.getPoolPDA(poolId);

    const tx = await this.program.methods
      .emergencyWithdraw()
      .accounts({
        pool: poolPDA,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    console.log("Emergency withdrawal:", tx);
    return tx;
  }

  // Update fee recipient
  async updateFeeRecipient(
    poolId: number,
    newFeeRecipient: PublicKey,
    owner: anchor.web3.Keypair
  ): Promise<string> {
    const [poolPDA] = this.getPoolPDA(poolId);

    const tx = await this.program.methods
      .updateFeeRecipient(newFeeRecipient)
      .accounts({
        pool: poolPDA,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    console.log("Fee recipient updated:", tx);
    return tx;
  }

  // Get contract balance
  async getContractBalance(poolId: number): Promise<number> {
    const [poolPDA] = this.getPoolPDA(poolId);

    try {
      const balance = await this.program.methods
        .getContractBalance()
        .accounts({
          pool: poolPDA,
        })
        .view();

      return balance.toNumber();
    } catch (error) {
      console.log("Pool not found");
      return 0;
    }
  }

  // Helper function to convert SOL to lamports
  solToLamports(sol: number): number {
    return sol * LAMPORTS_PER_SOL;
  }

  // Helper function to convert lamports to SOL
  lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
  }
}
