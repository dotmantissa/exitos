// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract ExitVault is ERC4626 {
    constructor(IERC20 token) ERC20("ExitOS Test Vault Share", "exitXUSD") ERC4626(token) {}

    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }
}
