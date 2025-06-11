// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Escrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract EscrowTest is Test {
    PokerEscrow public escrow;
    MockToken public token;
    address public alice = address(0x1);
    address public bob = address(0x2);
    uint256 public constant BUY_IN = 100 * 10**18;

    function setUp() public {
        token = new MockToken();
        escrow = new PokerEscrow(address(token), BUY_IN);
        
        // Transfer tokens to test addresses
        token.transfer(alice, BUY_IN * 2);
        token.transfer(bob, BUY_IN * 2);
    }

    function testBuyIn() public {
        vm.startPrank(alice);
        token.approve(address(escrow), BUY_IN);
        escrow.buyIn(BUY_IN);
        vm.stopPrank();

        assertEq(escrow.deposits(alice), BUY_IN);
        assertEq(token.balanceOf(address(escrow)), BUY_IN);
    }

    function testEndGame() public {
        // Setup: Both players buy in
        vm.startPrank(alice);
        token.approve(address(escrow), BUY_IN);
        escrow.buyIn(BUY_IN);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(escrow), BUY_IN);
        escrow.buyIn(BUY_IN);
        vm.stopPrank();

        // End game with 60/40 split
        address[] memory winners = new address[](2);
        winners[0] = alice;
        winners[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 60;
        shares[1] = 40;

        escrow.endGame(winners, shares);

        assertEq(token.balanceOf(alice), BUY_IN * 2 + (BUY_IN * 2 * 60) / 100);
        assertEq(token.balanceOf(bob), BUY_IN * 2 + (BUY_IN * 2 * 40) / 100);
        assertTrue(escrow.gameEnded());
    }

    function testFailInvalidBuyIn() public {
        vm.startPrank(alice);
        token.approve(address(escrow), BUY_IN);
        escrow.buyIn(BUY_IN / 2); // Should fail
        vm.stopPrank();
    }

    function testFailGameAlreadyEnded() public {
        // Setup: One player buys in
        vm.startPrank(alice);
        token.approve(address(escrow), BUY_IN);
        escrow.buyIn(BUY_IN);
        vm.stopPrank();

        // End game
        address[] memory winners = new address[](1);
        winners[0] = alice;
        uint256[] memory shares = new uint256[](1);
        shares[0] = 100;
        escrow.endGame(winners, shares);

        // Try to end game again
        escrow.endGame(winners, shares); // Should fail
    }
} 