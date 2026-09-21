// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LiveCryptoRouter
 * @author Live Crypto Protocol Team
 * @notice Non-custodial fee-splitting router for live stream Web3 donations.
 * @dev Routes native crypto (ETH, POL, BNB, AVAX) and ERC-20 tokens directly
 *      to the streamer's personal wallet (98%) while directing a configurable
 *      platform fee (default 2%) to the platform treasury in a single atomic transaction.
 */
contract LiveCryptoRouter is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Maximum allowed fee in basis points (1000 = 10%)
    uint256 public constant MAX_FEE_BPS = 1000;
    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Address of the platform treasury receiving platform fees
    address public platformTreasury;

    /// @notice Current platform fee in basis points (e.g., 200 = 2.0%)
    uint256 public feePercentage;

    /// @notice Emitted when a donation is processed and routed atomically
    event DonationRouted(
        address indexed sender,
        address indexed streamer,
        uint256 amount,
        uint256 fee,
        uint256 netAmount,
        address token,
        string memo
    );

    /// @notice Emitted when the platform treasury address is updated
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /// @notice Emitted when the platform fee percentage is updated
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when emergency rescue occurs
    event EmergencyRescued(address indexed token, address indexed to, uint256 amount);

    /**
     * @dev Constructor initializing treasury address and protocol fee percentage
     * @param _platformTreasury Address where platform fees are sent
     * @param _feePercentage Initial fee percentage in basis points (e.g. 200 for 2%)
     */
    constructor(address _platformTreasury, uint256 _feePercentage) Ownable(msg.sender) {
        require(_platformTreasury != address(0), "LiveCrypto: Invalid treasury address");
        require(_feePercentage <= MAX_FEE_BPS, "LiveCrypto: Fee exceeds maximum cap");
        platformTreasury = _platformTreasury;
        feePercentage = _feePercentage;
    }

    /**
     * @notice Process a donation in native currency (ETH, POL, etc.) with donor message memo
     * @param streamer The streamer wallet receiving the net donation
     * @param memo Optional donation message or identification hash for OBS alert HUD
     */
    function donateNativeWithMemo(
        address payable streamer,
        string memory memo
    ) public payable nonReentrant whenNotPaused {
        require(msg.value > 0, "LiveCrypto: Donation amount must be > 0");
        require(streamer != address(0), "LiveCrypto: Invalid streamer address");

        uint256 feeAmount = (msg.value * feePercentage) / BPS_DENOMINATOR;
        uint256 netAmount = msg.value - feeAmount;

        // Route fee to platform treasury
        if (feeAmount > 0) {
            (bool feeSuccess, ) = platformTreasury.call{value: feeAmount}("");
            require(feeSuccess, "LiveCrypto: Platform fee transfer failed");
        }

        // Route net amount to streamer wallet
        (bool streamerSuccess, ) = streamer.call{value: netAmount}("");
        require(streamerSuccess, "LiveCrypto: Streamer payout failed");

        emit DonationRouted(msg.sender, streamer, msg.value, feeAmount, netAmount, address(0), memo);
    }

    /**
     * @notice Process a donation in native currency without a memo (backwards compatible)
     * @param streamer The streamer wallet receiving the net donation
     */
    function donateNative(address payable streamer) external payable {
        donateNativeWithMemo(streamer, "");
    }

    /**
     * @notice Process a donation in any ERC-20 token with donor message memo
     * @param token The ERC-20 token address (USDC, USDT, DAI, etc.)
     * @param streamer The streamer wallet receiving the net donation
     * @param amount The total donation amount in token base units
     * @param memo Optional donation message or identification hash for OBS alert HUD
     */
    function donateERC20WithMemo(
        address token,
        address streamer,
        uint256 amount,
        string memory memo
    ) public nonReentrant whenNotPaused {
        require(amount > 0, "LiveCrypto: Donation amount must be > 0");
        require(streamer != address(0), "LiveCrypto: Invalid streamer address");
        require(token != address(0), "LiveCrypto: Invalid token address");

        uint256 feeAmount = (amount * feePercentage) / BPS_DENOMINATOR;
        uint256 netAmount = amount - feeAmount;

        // Route fee to platform treasury
        if (feeAmount > 0) {
            IERC20(token).safeTransferFrom(msg.sender, platformTreasury, feeAmount);
        }

        // Route net amount directly to streamer wallet
        IERC20(token).safeTransferFrom(msg.sender, streamer, netAmount);

        emit DonationRouted(msg.sender, streamer, amount, feeAmount, netAmount, token, memo);
    }

    /**
     * @notice Process a donation in ERC-20 token without a memo (backwards compatible)
     * @param token The ERC-20 token contract address
     * @param streamer The streamer wallet receiving the net donation
     * @param amount The total donation amount
     */
    function donateERC20(
        address token,
        address streamer,
        uint256 amount
    ) external {
        donateERC20WithMemo(token, streamer, amount, "");
    }

    // ──────────────────────────────────────────────
    // ADMIN & GOVERNANCE FUNCTIONS
    // ──────────────────────────────────────────────

    /**
     * @notice Updates the platform treasury destination
     * @param newTreasury New address for platform fees
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "LiveCrypto: Invalid treasury address");
        address oldTreasury = platformTreasury;
        platformTreasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Updates the platform fee in basis points (max 10%)
     * @param newFee New fee in bps (e.g., 200 = 2%)
     */
    function setFeePercentage(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE_BPS, "LiveCrypto: Fee exceeds maximum cap");
        uint256 oldFee = feePercentage;
        feePercentage = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Pause donations in case of emergency or protocol upgrade
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause donations when safe
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Rescues accidentally trapped ERC-20 tokens sent directly to this contract
     */
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "LiveCrypto: Invalid destination address");
        IERC20(token).safeTransfer(to, amount);
        emit EmergencyRescued(token, to, amount);
    }

    /**
     * @notice Rescues accidentally trapped native currency sent directly to this contract
     */
    function rescueNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "LiveCrypto: Invalid destination address");
        require(amount <= address(this).balance, "LiveCrypto: Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "LiveCrypto: Rescue transfer failed");
        emit EmergencyRescued(address(0), to, amount);
    }

    /**
     * @dev Allows contract to receive native currency for emergency rescue
     */
    receive() external payable {}
}
