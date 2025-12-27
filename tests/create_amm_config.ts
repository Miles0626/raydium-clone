import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { RaydiumClone } from "../target/types/raydium_clone";
import { expect } from "chai";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

describe("Raydium Clone: AmmConfig Full Lifecycle Tests", () => {
  // 1. Initialize Provider and Program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RaydiumClone as Program<RaydiumClone>;

  // 2. Define constants
  const CONFIG_INDEX = 5; // Using a specific index to avoid conflicts
  const AMM_CONFIG_SEED = "amm_config";
  let ammConfigPda: PublicKey;

  // 3. Calculate PDA before running tests
  before(async () => {
    [ammConfigPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(AMM_CONFIG_SEED),
        new BN(CONFIG_INDEX).toArrayLike(Buffer, "be", 2),
      ],
      program.programId
    );
    console.log("Test Account PDA:", ammConfigPda.toBase58());
  });

  // --- Part 1: Creation Tests ---

  describe("create_amm_config", () => {
    it("✅ Successfully initialize AmmConfig account", async () => {
      const tradeFeeRate = 3000;
      const protocolFeeRate = 1000;
      const fundFeeRate = 500;
      const tickSpacing = 60;

      await program.methods
        .createAmmConfig(
          CONFIG_INDEX,
          tickSpacing,
          tradeFeeRate,
          protocolFeeRate,
          fundFeeRate
        )
        .accounts({
          owner: provider.wallet.publicKey,
          ammConfig: ammConfigPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const account = await program.account.ammConfig.fetch(ammConfigPda);
      console.log("AmmConfig Account Data Details:", JSON.stringify(account, null, 2));
      
      expect(account.index).to.equal(CONFIG_INDEX);
      expect(account.tradeFeeRate).to.equal(tradeFeeRate);
      expect(account.owner.equals(provider.wallet.publicKey)).to.be.true;
      console.log("✅ AmmConfig initialized successfully");
    });
  });

  // --- Part 2: Update Tests ---

  describe("update_amm_config", () => {
    
    it("✅ Successfully update trade fee rate (Param = 0)", async () => {
      const newTradeFee = 4500;
      await program.methods
        .updateAmmConfig(0, newTradeFee)
        .accounts({
          owner: provider.wallet.publicKey,
          ammConfig: ammConfigPda,
        })
        .rpc();

      const account = await program.account.ammConfig.fetch(ammConfigPda);
      expect(account.tradeFeeRate).to.equal(newTradeFee);
      console.log("✅ Trade fee rate updated to:", newTradeFee);
    });

    it("✅ Successfully transfer owner (Param = 3)", async () => {
      const newOwner = Keypair.generate().publicKey;

      await program.methods
        .updateAmmConfig(3, 0)
        .accounts({
          owner: provider.wallet.publicKey,
          ammConfig: ammConfigPda,
        })
        .remainingAccounts([
          { pubkey: newOwner, isWritable: false, isSigner: false },
        ])
        .rpc();

      const account = await program.account.ammConfig.fetch(ammConfigPda);
      expect(account.owner.equals(newOwner)).to.be.true;
      console.log("✅ Ownership transferred successfully to:", newOwner.toBase58());
    });

    it("❌ Error path: input invalid Param flag", async () => {
      try {
        await program.methods
          .updateAmmConfig(99, 1000)
          .accounts({
            owner: provider.wallet.publicKey,
            ammConfig: ammConfigPda,
          })
          .rpc();
        expect.fail("Should have failed with InvalidUpdateConfigFlag");
      } catch (error: any) {
        // Verify that the custom error is returned
        expect(error.message).to.include("InvalidUpdateConfigFlag");
        console.log("✅ Successfully caught invalid Param flag error");
      }
    });
  });
});