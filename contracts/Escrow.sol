// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/Escrow.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PokerEscrow is Escrow {
    mapping(address => uint256) public deposits;
    address public immutable token;
    uint256 public immutable buyInAmount;
    bool public gameEnded;

    event BuyIn(address indexed player, uint256 amount);
    event GameEnded(address[] winners, uint256[] shares);

    constructor(address _token, uint256 _buyInAmount) {
        token = _token;
        buyInAmount = _buyInAmount;
    }

    function buyIn(uint256 amount) external {
        require(!gameEnded, "Game has ended");
        require(amount == buyInAmount, "Invalid buy-in amount");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] = amount;
        
        emit BuyIn(msg.sender, amount);
    }

    function endGame(address[] calldata winners, uint256[] calldata shares) external {
        require(!gameEnded, "Game already ended");
        require(winners.length == shares.length, "Invalid winners/shares length");
        
        uint256 totalShares;
        for (uint256 i = 0; i < shares.length; i++) {
            totalShares += shares[i];
        }
        require(totalShares == 100, "Shares must total 100%");

        uint256 totalDeposits = IERC20(token).balanceOf(address(this));
        for (uint256 i = 0; i < winners.length; i++) {
            uint256 share = (totalDeposits * shares[i]) / 100;
            IERC20(token).transfer(winners[i], share);
        }

        gameEnded = true;
        emit GameEnded(winners, shares);
    }
} 