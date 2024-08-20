import { ethers } from "ethers";
import FACTORY_ABI from "./abis/factory.json" assert { type: "json" };
import SWAP_ROUTER_ABI from "./abis/swaprouter.json" assert { type: "json" };
import POOL_ABI from "./abis/pool.json" assert { type: "json" };
import TOKEN_IN_ABI from "./abis/token.json" assert { type: "json" };
import LENDING_POOL_ABI from "./abis/lendingpool.json" assert { type: "json" };

import dotenv from "dotenv";
dotenv.config();

const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const SWAP_ROUTER_CONTRACT_ADDRESS =
  "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const LENDING_POOL_ADDRESS = 
  "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const factoryContract = new ethers.Contract(
  POOL_FACTORY_CONTRACT_ADDRESS,
  FACTORY_ABI,
  provider
);

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Aave Lending Pool Contract
const lendingPool = new ethers.Contract(
  LENDING_POOL_ADDRESS,
  LENDING_POOL_ABI,
  signer
);

//Part A - Input Token Configuration
const DAI = {
  chainId: 11155111,
  // Aave Test DAI
  address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
  decimals: 18,
  symbol: "DAI",
  name: "MakerDAO",
  isToken: true,
  isNative: true,
  wrapped: false,
};

const LINK = {
  chainId: 11155111,
  // Aave Test LINK
  address: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
  decimals: 18,
  symbol: "LINK",
  name: "Chainlink",
  isToken: true,
  isNative: true,
  wrapped: false,
};

//Part B - Write Approve Token Function
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), DAI.decimals);
    const approveTransaction = await tokenContract.approve.populateTransaction(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      approveAmount
    );
    const transactionResponse =
      await wallet.sendTransaction(approveTransaction);
    console.log(`-------------------------------`);
    console.log(`Sending Approval Transaction...`);
    console.log(`-------------------------------`);
    console.log(`Transaction Sent: ${transactionResponse.hash}`);
    console.log(`-------------------------------`);
    const receipt = await transactionResponse.wait();
    console.log(
      `Approval Transaction Confirmed! https://sepolia.etherscan.io/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("An error occurred during token approval:", error);
    throw new Error("Token approval failed");
  }
}

//Part C - Write Get Pool Info Function
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
  const poolAddress = await factoryContract.getPool(
    tokenIn.address,
    tokenOut.address,
    3000
  );
  if (!poolAddress) {
    throw new Error("Failed to get pool address");
  }
  const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);
  return { poolContract, token0, token1, fee };
}

//Part D - Write Prepare Swap Params Function
async function prepareSwapParams(poolContract, signer, amountIn) {
  return {
    tokenIn: DAI.address,
    tokenOut: LINK.address,
    fee: await poolContract.fee(),
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
}

// Get LINK Token Balance
async function getTokenBalance(tokenAddress, wallet) {
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_IN_ABI, wallet);
  const balance = await tokenContract.balanceOf(wallet.address);
  return ethers.formatUnits(balance, LINK.decimals);
}

//Part E - Write Execute Swap Function
async function executeSwap(swapRouter, params, signer) {
  // Get LINK Token Balance before the swap
  const linkBalanceBefore = await getTokenBalance(LINK.address, signer);

  // Execute the swap
  const transaction =
    await swapRouter.exactInputSingle.populateTransaction(params);
  const transactionResponse = await signer.sendTransaction(transaction);
  console.log(`-------------------------------`);
  console.log(`Transaction Sent: ${transactionResponse.hash}`);
  console.log(`-------------------------------`);

  // Wait for the transaction to be confirmed
  const receipt = await transactionResponse.wait();
  console.log(
    `Transaction Confirmed: https://sepolia.etherscan.io/tx/${receipt.hash}`
  );
  console.log(`-------------------------------`);

  // Get the LINK balance after the swap
  const linkBalanceAfter = await getTokenBalance(LINK.address, signer);

  // Calculate the swapped amount
  const swappedAmount = linkBalanceAfter - linkBalanceBefore;
  console.log(`Swapped LINK Amount: ${swappedAmount}`);

  return swappedAmount;
}

// Modified Approve Lending Pool Function
async function authorizeLendingPool(tokenAddr, qty, signer) {
  const tokenInst = new ethers.Contract(tokenAddr, TOKEN_IN_ABI, signer);
  const approveQty = ethers.parseUnits(qty.toString(), LINK.decimals);
  console.log(`Granting approval to Lending Pool for ${approveQty} LINK...`);
  
  const approvalTx = await tokenInst.approve.populateTransaction(
    LENDING_POOL_ADDRESS,
    approveQty
  );

  // Send the approval transaction
  const approvalResponse = await signer.sendTransaction(approvalTx);
  // Wait for transaction confirmation
  await approvalResponse.wait();
  console.log("LINK successfully authorized for Aave lending.");
}

// Modified Supply to Aave Function
async function depositToAave(poolInstance, qty, tokenAddr, signer) {
  const supplyQty = ethers.parseUnits(qty.toString(), LINK.decimals);
  const depositTx = await poolInstance.supply(
    tokenAddr,
    supplyQty,
    signer.address,
    0,
    {
      gasLimit: 500000,
    }
  );
  await depositTx.wait();
  console.log(`Deposit successful https://sepolia.etherscan.io/tx/${depositTx.hash}`);
}

// Modified Main Function
async function executeSwapAndDeposit(swapQty) {
  const inputQty = swapQty;
  const inputInUnits = ethers.parseUnits(inputQty.toString(), DAI.decimals);

  try {
    // Approve the DAI amount
    await approveToken(DAI.address, TOKEN_IN_ABI, inputQty, signer);

    // Get the pool contract
    const { poolContract } = await getPoolInfo(factoryContract, DAI, LINK);
    const swapParams = await prepareSwapParams(poolContract, signer, inputInUnits);
    const swapRouter = new ethers.Contract(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      SWAP_ROUTER_ABI,
      signer
    );

    // Execute swap and get the LINK amount
    const swappedQty = await executeSwap(swapRouter, swapParams, signer);

    // Approve the LINK amount for lending
    await authorizeLendingPool(LINK.address, swappedQty, signer);

    // Supply the LINK amount to Aave
    await depositToAave(lendingPool, swappedQty, LINK.address, signer);
  } catch (err) {
    console.error("An error occurred during the process:", err.message);
  }
}

// Start the main function
executeSwapAndDeposit(1);
