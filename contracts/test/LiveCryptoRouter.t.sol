// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/LiveCryptoRouter.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUSD is ERC20 {
    constructor() ERC20("Test USD", "tUSD") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract LiveCryptoRouterTest {
    LiveCryptoRouter router;
    TestUSD token;
    address payable treasury = payable(address(0x1111111111111111111111111111111111111111));
    address payable streamer = payable(address(0x2222222222222222222222222222222222222222));
    address payable stranger = payable(address(0x3333333333333333333333333333333333333333));

    function setUp() public {
        router = new LiveCryptoRouter(treasury, 200); // 200 bps = 2%
        token = new TestUSD();
    }

    function test_InitialConfig() public view {
        require(router.platformTreasury() == treasury, "Treasury mismatch");
        require(router.feePercentage() == 200, "Fee mismatch");
        require(!router.paused(), "Should not be paused initially");
    }

    function test_FeeCalculation_Native() public {
        uint256 initialStreamerBalance = streamer.balance;
        uint256 initialTreasuryBalance = treasury.balance;
        uint256 donation = 1 ether;

        router.donateNative{value: donation}(streamer);

        require(streamer.balance - initialStreamerBalance == 0.98 ether, "Streamer net incorrect (expected 98%)");
        require(treasury.balance - initialTreasuryBalance == 0.02 ether, "Treasury fee incorrect (expected 2%)");
    }

    function test_DonateNativeWithMemo() public {
        uint256 initialStreamerBalance = streamer.balance;
        uint256 initialTreasuryBalance = treasury.balance;
        uint256 donation = 0.5 ether;

        router.donateNativeWithMemo{value: donation}(streamer, unicode"GGWP! Great gameplay 🚀");

        require(streamer.balance - initialStreamerBalance == 0.49 ether, "Streamer net memo incorrect");
        require(treasury.balance - initialTreasuryBalance == 0.01 ether, "Treasury fee memo incorrect");
    }

    function test_FeeCalculation_ERC20() public {
        uint256 donation = 100 * 10 ** 6;
        token.approve(address(router), donation);

        router.donateERC20(address(token), streamer, donation);

        require(token.balanceOf(streamer) == 98 * 10 ** 6, "Streamer ERC20 net incorrect");
        require(token.balanceOf(treasury) == 2 * 10 ** 6, "Treasury ERC20 fee incorrect");
        require(token.balanceOf(address(router)) == 0, "Router must not custody ERC20 donations");
    }

    function test_OwnerCanUpdateFee() public {
        router.setFeePercentage(300);
        require(router.feePercentage() == 300, "Fee update failed");
    }

    function test_OwnerCanUpdateTreasury() public {
        address newTreasury = address(0x4444444444444444444444444444444444444444);
        router.setTreasury(newTreasury);
        require(router.platformTreasury() == newTreasury, "Treasury update failed");
    }

    function test_EmergencyPauseAndUnpause() public {
        router.pause();
        require(router.paused(), "Router should be paused");

        router.unpause();
        require(!router.paused(), "Router should be unpaused");

        // Verify donation works after unpause
        router.donateNative{value: 0.1 ether}(streamer);
    }

    function test_RescueNative() public {
        // Direct transfer to router contract
        (bool sent, ) = address(router).call{value: 0.05 ether}("");
        require(sent, "Initial funding of router failed");

        uint256 strangerBefore = stranger.balance;
        router.rescueNative(stranger, 0.05 ether);
        require(stranger.balance - strangerBefore == 0.05 ether, "Rescue native failed");
    }

    receive() external payable {}
}
