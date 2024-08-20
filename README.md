# DeFi Script: Uniswap Swap & Aave Supply
## Overview of Script

This script showcases the seamless integration of two popular DeFi protocols Uniswap and Aave a single workflow. It begins by swapping DAI for LINK on Uniswap and subsequently supplies the acquired LINK tokens to Aave, where they start earning interest.

## Key Features:

- **Token Swap on Uniswap:** The script initiates a token swap using Uniswap's V3 protocol, converting DAI into LINK.
- **Supply to Aave:** The script then supplies the LINK tokens to Aave's lending pool, enabling interest generation.
- **Ethereum Sepolia Testnet:** The entire workflow is designed to be executed on the Sepolia testnet, making it easy to test without risking real assets.

## Workflow Summary:

1. **Approval:** The script approves the Uniswap Swap Router contract to spend DAI tokens on the user’s behalf.
2. **Swap:** DAI is swapped for LINK using Uniswap.
3. **Supply to Aave:** The LINK tokens are supplied to Aave's lending pool, enabling the user to earn interest on their LINK holdings.

### Diagram Illustration

Below is a diagram that visually represents the workflow of the script:
![Diagram](https://mermaid.ink/img/pako:eNo90c1uwyAMAOBXsTjs1L5ADpPS_HTRqilSthPpwUrcBC0BREi3ruq7z6VsnPj5bIy5is70JBIxOLQjvOetBh6p_FjIQaWVV-hpAT8S1M50tCxH2G6fYSdTa505E-RpBSfjoPlCe3yE7wLJ5J481MZMnIjFjF4ZHUkWSC5rRxYdhWio0eFMntwSVR5UIYtv6lYf1T2O7_QGDtXba5RFkOV_VfejUNaBdK_0EFkZ2F42q7XT5aE4UYpnimIfxIvMjD6pWDM8Qak0Turn7wliI2biU9Vz7673yFZwj2ZqRcLTHt1nK1p9Y4erN81FdyLxbqWNcGYdRpGccFp4tdqeG5wr5A-Y4-7tF867gO8?type=png)

## Code Explanation:

### Part A - Input Token Configuration

```javascript
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
```

These objects define the properties of the tokens involved in the swap: DAI and LINK. This includes their addresses on the Sepolia network, number of decimals, and other relevant metadata.

### Part B - Approve Token Function

```javascript
async function approveToken(tokenAddress, tokenABI, amount, wallet) { ... }
```

This function handles the approval process, allowing the Uniswap Swap Router to spend the specified amount of DAI on behalf of the user. Approval is a crucial step before any token transfer or swap.

### Part C - Get Pool Info Function

```javascript
async function getPoolInfo(factoryContract, tokenIn, tokenOut) { ... }
```

This function retrieves information about the liquidity pool used for the swap, including the pool’s address, the tokens involved, and the fee structure. It ensures that the swap happens in the correct pool.

### Part D - Prepare Swap Params Function

```javascript
async function prepareSwapParams(poolContract, signer, amountIn) { ... }
```

This function prepares the parameters required for the Uniswap swap transaction. It includes the token addresses, the amount to swap, the recipient, and other essential details.

### Part E - Execute Swap Function

```javascript
async function executeSwap(swapRouter, params, signer) { ... }
```

This function executes the token swap on Uniswap using the parameters prepared earlier. It sends the transaction to the Ethereum network and waits for confirmation.

### Part F - Supply to Aave Function

```javascript
async function depositToAave(poolInstance, qty, tokenAddr, signer) { ... }
```

This function handles the supply of LINK tokens to Aave's lending pool. It approves Aave to spend the LINK tokens and then deposits them into Aave, allowing the user to start earning interest.

### Part G - Main Function

```javascript
async function executeSwapAndDeposit(swapQty) { ... }
```

### Result of the code:
![image](https://github.com/user-attachments/assets/486156aa-741e-4f90-a735-56d785c8d0de)

The main function orchestrates the entire workflow. It approves the Uniswap router to spend DAI, swaps DAI for LINK, and then supplies the LINK to Aave. Error handling ensures that each step is executed correctly.

## How to Run the Script:

1. **Clone the Repository:** 

```bash
git clone https://github.com/YourUsername/DeFi-Script.git
```

2. **Install Dependencies:** 

```bash
npm install
```

3. **Configure Environment Variables:** 

Update the `.env` file with your Sepolia RPC URL and private key.

4. **Run the Script:** 

```bash
node index.js
```

## Conclusion:

This project highlights the composability of DeFi protocols, showing how they can be integrated to create more complex financial strategies. By combining Uniswap and Aave, the script not only demonstrates a basic swap but also adds value by automatically earning interest on the swapped tokens. Feel free to experiment with other DeFi protocols and extend this script further!
