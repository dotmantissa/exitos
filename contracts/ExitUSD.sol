// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExitUSD is ERC20 {
    mapping(address => uint256) public nextClaimAt;
    uint256 public constant CLAIM_AMOUNT = 1000 ether;

    constructor() ERC20("ExitOS Test Credit", "XUSD") {}

    function claim() external {
        require(block.timestamp >= nextClaimAt[msg.sender], "Claim available tomorrow");
        nextClaimAt[msg.sender] = block.timestamp + 1 days;
        _mint(msg.sender, CLAIM_AMOUNT);
    }
}
