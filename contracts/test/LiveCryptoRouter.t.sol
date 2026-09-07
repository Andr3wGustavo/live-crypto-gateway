// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/LiveCryptoRouter.sol";

contract LiveCryptoRouterTest {
    LiveCryptoRouter router;
    address payable treasury = payable(address(0x1111111111111111111111111111111111111111));
    address payable streamer = payable(address(0x2222222222222222222222222222222222222222));

    function setUp() public {
        router = new LiveCryptoRouter(treasury, 200);
    }

    function test_InitialConfig() public view {
        require(router.platformTreasury() == treasury, "Treasury mismatch");
        require(router.feePercentage() == 200, "Fee mismatch");
    }

    function test_FeeCalculation() public {
        uint256 donation = 1 ether;
        router.donateNative{value: donation}(streamer);
        require(streamer.balance == 0.98 ether, "Streamer net incorrect");
        require(treasury.balance == 0.02 ether, "Treasury fee incorrect");
    }

    function test_OwnerCanUpdateFee() public {
        router.setFeePercentage(300);
        require(router.feePercentage() == 300, "Fee update failed");
    }

    receive() external payable {}
}
