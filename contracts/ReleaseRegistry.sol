// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

interface IReleaseProcessor {
    function netlist(uint256) external view returns (bytes memory);
    function circuitInfo(uint256) external view returns (uint32, uint32, uint32, uint32);
    function eval(uint256, bytes calldata) external view returns (bytes memory);
}

contract ReleaseRegistry is EIP712 {
    struct Release { bytes32 root; address store; uint64 admittedAt; bool revoked; }
    bytes32 public immutable project;
    address public immutable processor;
    bytes32 public immutable processorCodeHash;
    bytes32 public immutable circuitHash;
    address[4] public reviewers;
    uint256 public nextNonce;
    uint256 public currentRelease;
    mapping(uint256 => Release) public releases;
    bytes32 public constant APPROVAL_TYPEHASH = keccak256("Approval(bytes32 project,uint8 operation,uint256 nonce,uint256 releaseId,bytes32 root,address store,uint64 expiresAt)");

    event ReleaseAdmitted(uint256 indexed releaseId, bytes32 indexed root, address indexed store);
    event ReleaseRevoked(uint256 indexed releaseId);

    constructor(bytes32 project_, address processor_, bytes32 expectedCircuitHash, address[4] memory reviewers_) EIP712("ExitOS Release Registry", "1") {
        require(processor_.code.length > 0, "Processor unavailable");
        for (uint256 i; i < 4; ++i) {
            require(reviewers_[i] != address(0), "Empty reviewer");
            for (uint256 j; j < i; ++j) require(reviewers_[i] != reviewers_[j], "Duplicate reviewer");
        }
        project = project_;
        processor = processor_;
        processorCodeHash = processor_.codehash;
        circuitHash = expectedCircuitHash;
        reviewers = reviewers_;
        _checkProcessor();
    }

    function approvalDigest(uint8 operation, uint256 nonce, uint256 releaseId, bytes32 root, address store, uint64 expiresAt) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(APPROVAL_TYPEHASH, project, operation, nonce, releaseId, root, store, expiresAt)));
    }

    function admit(bytes32 root, address store, uint64 expiresAt, bytes[] calldata signatures) external returns (uint256 releaseId) {
        require(root != bytes32(0) && store.code.length > 0, "Invalid release");
        releaseId = nextNonce + 1;
        _authorize(0, releaseId, root, store, expiresAt, signatures);
        releases[releaseId] = Release(root, store, uint64(block.timestamp), false);
        currentRelease = releaseId;
        emit ReleaseAdmitted(releaseId, root, store);
    }

    function revoke(uint256 releaseId, uint64 expiresAt, bytes[] calldata signatures) external {
        Release storage release = releases[releaseId];
        require(release.admittedAt != 0 && !release.revoked, "Release unavailable");
        _authorize(1, releaseId, release.root, release.store, expiresAt, signatures);
        release.revoked = true;
        emit ReleaseRevoked(releaseId);
    }

    function _authorize(uint8 operation, uint256 releaseId, bytes32 root, address store, uint64 expiresAt, bytes[] calldata signatures) private {
        require(block.timestamp <= expiresAt, "Approval expired");
        require(signatures.length >= 3 && signatures.length <= 4, "Incomplete approvals");
        bytes32 digest = approvalDigest(operation, nextNonce, releaseId, root, store, expiresAt);
        uint8 mask;
        for (uint256 i; i < signatures.length; ++i) {
            address signer = ECDSA.recover(digest, signatures[i]);
            uint8 bit;
            for (uint256 j; j < 4; ++j) if (reviewers[j] == signer) bit = uint8(1 << j);
            require(bit != 0 && mask & bit == 0, "Invalid reviewer");
            mask |= bit;
        }
        _checkProcessor();
        (bool ok, bytes memory encoded) = processor.staticcall{gas: 120000}(abi.encodeCall(IReleaseProcessor.eval, (1, abi.encodePacked(mask))));
        require(ok && encoded.length == 96, "Circuit evaluation failed");
        bytes memory result = abi.decode(encoded, (bytes));
        require(result.length == 1 && result[0] == bytes1(uint8(1)), "Release policy denied");
        ++nextNonce;
    }

    function _checkProcessor() private view {
        require(processor.codehash == processorCodeHash, "Processor code changed");
        require(keccak256(IReleaseProcessor(processor).netlist(1)) == circuitHash, "Circuit changed");
        (uint32 inputs, uint32 outputs, uint32 state, uint32 gates) = IReleaseProcessor(processor).circuitInfo(1);
        require(inputs == 4 && outputs == 1 && state == 0 && gates == 8, "Circuit dimensions changed");
    }
}
