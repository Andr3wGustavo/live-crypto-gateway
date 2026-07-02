// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LiveCryptoRouter
 * @dev Non-custodial fee-splitting router for the Live Crypto donation platform.
 */
contract LiveCryptoRouter {
    address public platformTreasury;
    uint256 public feePercentage; // fee in basis points (e.g., 200 = 2%)

    event DonationRouted(
        address indexed sender,
        address indexed streamer,
        uint256 amount,
        uint256 fee,
        uint256 netAmount
    );

    event TreasuryUpdated(address newTreasury);
    event FeeUpdated(uint256 newFee);

    constructor(address _platformTreasury, uint256 _feePercentage) {
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

        emit DonationRouted(msg.sender, streamer, msg.value, feeAmount, netAmount);
    }

    // Owner functions (simplified for this example; use OpenZeppelin Ownable in production)
    
    // Fallback and receive
    receive() external payable {}
}
