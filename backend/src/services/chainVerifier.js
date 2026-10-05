const { ethers } = require('ethers');
const axios = require('axios');
const { paymentConfig } = require('./paymentConfig');
const { decodePublicKey } = require('./solanaAuth');

const routerInterface = new ethers.Interface([
  'event DonationRouted(address indexed sender,address indexed streamer,uint256 amount,uint256 fee,uint256 netAmount,address token,string memo)'
]);
const reject = (status, message) => ({ verified: false, status, message });

class ChainVerifier {
  constructor({ config = paymentConfig, providerFactory, rpc = axios } = {}) {
    this.config = config;
    this.providerFactory = providerFactory || (url => {
      const request = new ethers.FetchRequest(url);
      request.timeout = 10000;
      return new ethers.JsonRpcProvider(request);
    });
    this.rpc = rpc;
  }

  async verifyTransaction({ tx_hash, chain, expected_recipient, expected_memo, expected_sender, expected_amount, expected_reference }) {
    const config = this.config();
    if (typeof tx_hash !== 'string' || typeof chain !== 'string' || !expected_recipient) return reject('INVALID', 'Hash, exact network and registered recipient are required');
    if (!config.enabled) return reject('DISABLED', 'Payments are not enabled in this environment');
    try {
      let result;
      if (chain === config.evm.chainId && config.evm.enabled) result = await this.verifyEVM(tx_hash, expected_recipient, config);
      else if (chain === config.solana.chainId && config.solana.enabled) result = await this.verifySolana(tx_hash, expected_recipient, config);
      else return reject('UNSUPPORTED', 'This payment network is not enabled');
      if (!result.verified) return result;
      const evm = chain === config.evm.chainId;
      if (expected_memo !== undefined && result.memo !== expected_memo) return reject('MISMATCH', 'Payment intent memo does not match');
      if (expected_sender && (evm ? result.sender.toLowerCase() !== expected_sender.toLowerCase() : result.sender !== expected_sender)) return reject('MISMATCH', 'Payment sender does not match');
      const decimals = evm ? 18 : 9;
      if (expected_amount && ethers.parseUnits(result.gross_amount, decimals) !== ethers.parseUnits(String(expected_amount).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''), decimals)) return reject('MISMATCH', 'Payment amount does not match');
      if (expected_reference && !result.references?.includes(expected_reference)) return reject('MISMATCH', 'Payment reference missing');
      return result;
    } catch {
      // Provider URLs and credentials must never appear in public error responses.
      return reject('ERROR', 'Unable to verify with the network. Retry the same transaction hash.');
    }
  }

  async verifyEVM(hash, recipient, config = this.config()) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash) || !ethers.isAddress(recipient)) return reject('INVALID', 'Invalid EVM transaction or recipient');
    const provider = this.providerFactory(config.evm.rpc);
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(config.evm.chainId)) return reject('ERROR', 'RPC network does not match configuration');
      const receipt = await provider.getTransactionReceipt(hash);
      if (!receipt) return reject('PENDING', 'Waiting for inclusion in a block');
      if (receipt.status !== 1) return reject('FAILED', 'Transaction reverted');
      if (receipt.to?.toLowerCase() !== config.evm.router.toLowerCase()) return reject('MISMATCH', 'Transaction was not sent to the configured donation router');
      const confirmations = await provider.getBlockNumber() - receipt.blockNumber + 1;
      if (confirmations < config.confirmations) return reject('PENDING', 'Waiting for required confirmations');
      if (config.evm.treasury) {
        const router = new ethers.Contract(config.evm.router, ['function platformTreasury() view returns(address)'], provider);
        if ((await router.platformTreasury({ blockTag: receipt.blockNumber })).toLowerCase() !== config.evm.treasury.toLowerCase()) return reject('MISMATCH', 'Historical treasury does not match intent');
      }

      const donations = receipt.logs.filter(log => log.address.toLowerCase() === config.evm.router.toLowerCase())
        .map(log => { try { return routerInterface.parseLog(log); } catch { return null; } })
        .filter(log => log?.name === 'DonationRouted');
      if (donations.length !== 1) return reject('MISMATCH', 'Expected exactly one donation event');
      const { sender, streamer, amount, fee, netAmount, token, memo } = donations[0].args;
      if (streamer.toLowerCase() !== recipient.toLowerCase()) return reject('MISMATCH', 'Recipient does not match the registered wallet');
      if (token !== ethers.ZeroAddress) return reject('UNSUPPORTED', 'Token donations require an approved token integration');
      if (amount <= 0n || netAmount <= 0n || fee !== amount * BigInt(config.feeBps) / 10000n || netAmount + fee !== amount) return reject('MISMATCH', 'Donation amount or platform fee is invalid');
      return { verified: true, status: 'CONFIRMED', tx_hash: hash.toLowerCase(), chain: config.evm.chainId,
        sender, recipient: streamer, amount: ethers.formatEther(netAmount), gross_amount: ethers.formatEther(amount),
        fee: ethers.formatEther(fee), currency: config.evm.currency, memo, confirmations };
    } finally { provider.destroy?.(); }
  }

  async verifySolana(hash, recipient, config = this.config()) {
    if (!/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(hash)) return reject('INVALID', 'Invalid Solana signature');
    decodePublicKey(recipient);
    decodePublicKey(config.solana.treasury);
    if (recipient === config.solana.treasury) return reject('INVALID', 'Recipient and treasury must differ');
    if (config.solana.genesisHash) {
      const genesis = await this.rpc.post(config.solana.rpc, { jsonrpc:'2.0',id:1,method:'getGenesisHash',params:[] }, { timeout:10000 });
      if (genesis.data.result !== config.solana.genesisHash) return reject('ERROR', 'Solana RPC cluster mismatch');
    }
    const { data } = await this.rpc.post(config.solana.rpc, {
      jsonrpc: '2.0', id: 1, method: 'getTransaction',
      params: [hash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'finalized' }]
    }, { timeout: 10000 });
    if (data.error) return reject('ERROR', 'Solana RPC could not verify this transaction');
    const tx = data.result;
    if (!tx) return reject('PENDING', 'Waiting for finalized Solana transaction');
    if (!tx.meta || tx.meta.err) return reject('FAILED', 'Solana transaction failed or has no execution metadata');
    const message = tx.transaction?.message;
    const signers = new Set((message?.accountKeys || []).filter(key => key.signer).map(key => key.pubkey));
    const memos = (message?.instructions || []).filter(ix => ix.programId === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memo = memos.length === 1 && typeof memos[0].parsed === 'string' ? memos[0].parsed : '';
    const transfers = (message?.instructions || []).filter(ix => ix.programId === '11111111111111111111111111111111' && ix.parsed?.type === 'transfer').map(ix => ix.parsed.info);
    const received = transfers.filter(t => t.destination === recipient && signers.has(t.source));
    if (received.length !== 1) return reject('MISMATCH', 'Expected a single signed transfer to the registered recipient');
    const sender = received[0].source;
    const fees = transfers.filter(t => t.source === sender && t.destination === config.solana.treasury);
    if (fees.length > 1) return reject('MISMATCH', 'Ambiguous treasury transfers');
    const lamports = value => {
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Unsafe lamports');
      return BigInt(value);
    };
    const net = lamports(received[0].lamports);
    const fee = fees.length ? lamports(fees[0].lamports) : 0n;
    const gross = net + fee;
    if (net <= 0n || fee !== gross * BigInt(config.feeBps) / 10000n) return reject('MISMATCH', 'Missing or incorrect platform fee');
    return { verified: true, status: 'CONFIRMED', tx_hash: hash, chain: config.solana.chainId,
      sender, recipient, amount: ethers.formatUnits(net, 9), gross_amount: ethers.formatUnits(gross, 9),
      fee: ethers.formatUnits(fee, 9), currency: 'SOL', slot: tx.slot, memo,
      references: (message?.accountKeys || []).map(key => typeof key === 'string' ? key : key.pubkey) };
  }
}

module.exports = new ChainVerifier();
module.exports.ChainVerifier = ChainVerifier;
module.exports.routerInterface = routerInterface;
