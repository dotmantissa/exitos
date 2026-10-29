// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// A testnet NAND evaluator using the published TapeOut TAP-02 wire format.
// This deployment is not a processor registered in the official TapeOut factory.
contract ReleaseProcessor {
    bytes private circuit;
    bytes32 public immutable circuitHash;

    constructor(bytes memory netlist_) {
        require(netlist_.length == 56, "Expected eight NAND gates");
        circuit = netlist_;
        circuitHash = keccak256(netlist_);
        for (uint256 i; i < 8; ++i) {
            require(uint8(netlist_[i * 7]) == 0, "Only NAND supported");
            require(_index(netlist_, i * 7 + 1) < 6 + i && _index(netlist_, i * 7 + 4) < 6 + i, "Invalid reference");
        }
    }

    function netlist(uint256 id) external view returns (bytes memory) {
        require(id == 1, "Unknown circuit");
        return circuit;
    }

    function circuitInfo(uint256 id) external pure returns (uint32, uint32, uint32, uint32) {
        require(id == 1, "Unknown circuit");
        return (4, 1, 0, 8);
    }

    function eval(uint256 id, bytes calldata inputs) external view returns (bytes memory) {
        require(id == 1, "Unknown circuit");
        uint8[14] memory signals;
        signals[1] = 1;
        uint8 packed = inputs.length == 0 ? 0 : uint8(inputs[0]);
        for (uint256 i; i < 4; ++i) signals[2 + i] = (packed >> i) & 1;
        bytes memory data = circuit;
        for (uint256 i; i < 8; ++i) {
            uint256 a = _index(data, i * 7 + 1);
            uint256 b = _index(data, i * 7 + 4);
            signals[6 + i] = 1 - (signals[a] & signals[b]);
        }
        return abi.encodePacked(signals[13]);
    }

    function _index(bytes memory data, uint256 i) private pure returns (uint256) {
        return (uint256(uint8(data[i])) << 16) | (uint256(uint8(data[i + 1])) << 8) | uint8(data[i + 2]);
    }
}
