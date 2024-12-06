// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");

// Import Web3
const Web3 = require("web3");

// Initialize the app
const app = express();
app.use(bodyParser.json()); // Parse JSON body data

// Blockchain setup
const providerURL = "https://bsc-dataseed.binance.org"; // BSC Testnet RPC URL
const privateKey = "391212aaff42ae000a1241ca7c24f2260b34d5729177277148c05de64af7719c"; // Replace with your private key
const contractAddress = "0x972cc9042815f869b38A60AA4984c8D3b1240803"; // Replace with your contract address
const contractABI = require("./abi/contractABI.json"); // ABI file

// Initialize Web3 with a provider
const web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

// Setup account
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Create contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

// API endpoint to call withdraw function
app.post("/api/withdraw", async (req, res) => {
  console.log('req',req);
  const { recipient, amount, flag } = req.body;

  // Input validation
  if (!web3.utils.isAddress(recipient)) {
    console.log('address',recipient);
    return res.status(400).json({ success: false, error: "Invalid recipient address" });
  }
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ success: false, error: "Invalid amount" });
  }
  // if (typeof flag !== "boolean") {
  //   return res.status(400).json({ success: false, error: "Flag must be a boolean" });
  // }

  try {
    // Convert amount to the smallest unit (e.g., wei)
    const weiAmount = web3.utils.toWei(amount.toString(), "ether");

    // Encode the smart contract method
    console.log('weiAmount',weiAmount);
    const data = contract.methods.withdraw(recipient, weiAmount, flag).encodeABI();

    // Build the transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: data,
      gas: 2000000, // Adjust gas limit based on contract complexity
    };

    // Estimate gas for the transaction
    const estimatedGas = await web3.eth.estimateGas(tx);
    tx.gas = estimatedGas;

    // Sign and send the transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Respond with transaction receipt
    res.json({ success: true, transactionHash: receipt.transactionHash });
  } catch (error) {
    console.error("Error during transaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
