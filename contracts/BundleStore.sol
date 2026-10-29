// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract BundleStore {
    bytes private content;
    bytes32 public immutable contentHash;

    constructor(bytes memory content_) {
        require(content_.length > 0 && content_.length <= 20000, "Invalid bundle size");
        content = content_;
        contentHash = sha256(content_);
    }

    function read() external view returns (bytes memory) { return content; }
}
