// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiveCryptoRouter
 * @dev Non-custodial fee-splitting router for the Live Crypto donation platform.
 */
contract LiveCryptoRouter is Ownable {
    using SafeERC20 for IERC20;

    address public platformTreasury;
    uint256 public feePercentage; // fee in basis points (e.g., 200 = 2%)

    event DonationRouted(
        address indexed sender,
        address indexed streamer,
        uint256 amount,
        uint256 fee,
        uint256 netAmount,
        address token // address(0) for native currency
    );

    event TreasuryUpdated(address newTreasury);
    event FeeUpdated(uint256 newFee);

    constructor(address _platformTreasury, uint256 _feePercentage) Ownable(msg.sender) {
        require(_platformTreasury != address(0), "Invalid treasury address");
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformTreasury = _platformTreasury;
        feePercentage = _feePercentage;
    }

    /**
     * @dev Main function to process a donation in native currency (ETH/MATIC/etc.)
     * @param streamer The address of the streamer receiving the donation
     */
    function donateNative(address payable streamer) external payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        require(streamer != address(0), "Invalid streamer address");

        uint256 feeAmount = (msg.value * feePercentage) / 10000;
        uint256 netAmount = msg.value - feeAmount;

        // Route fee to platform
        if (feeAmount > 0) {
            (bool feeSuccess, ) = platformTreasury.call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }

        // Route net amount to streamer
        (bool streamerSuccess, ) = streamer.call{value: netAmount}("");
        require(streamerSuccess, "Streamer transfer failed");

        emit DonationRouted(msg.sender, streamer, msg.value, feeAmount, netAmount, address(0));
    }

    /**
     * @dev Main function to process a donation in ERC-20 token
     * @param token The address of the ERC-20 token contract
     * @param streamer The address of the streamer receiving the donation
     * @param amount The total donation amount
     */
    function donateERC20(
        address token,
        address streamer,
        uint256 amount
    ) external {
        require(amount > 0, "Donation amount must be greater than 0");
        require(streamer != address(0), "Invalid streamer address");
        require(token != address(0), "Invalid token address");

        uint256 feeAmount = (amount * feePercentage) / 10000;
        uint256 netAmount = amount - feeAmount;

        // Route fee to platform
        if (feeAmount > 0) {
            IERC20(token).safeTransferFrom(msg.sender, platformTreasury, feeAmount);
        }

        // Route net amount to streamer
        IERC20(token).safeTransferFrom(msg.sender, streamer, netAmount);

        emit DonationRouted(msg.sender, streamer, amount, feeAmount, netAmount, token);
    }

    // Owner functions
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        platformTreasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function setFeePercentage(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        feePercentage = newFee;
        emit FeeUpdated(newFee);
    }
    
    // Fallback and receive
    receive() external payable {}
}

