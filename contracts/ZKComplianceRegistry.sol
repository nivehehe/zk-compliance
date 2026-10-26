// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input
    ) external view returns (bool);
}

/**
 * @title ZKComplianceRegistry
 * @dev Manages zero-knowledge compliance verification, identity commitments,
 * and soulbound compliance status for decentralized applications.
 */
contract ZKComplianceRegistry {
    IGroth16Verifier public immutable verifier;
    address public owner;

    uint256 public constant VALIDITY_PERIOD = 365 days;
    uint256 public constant MINIMUM_AGE_THRESHOLD = 18;

    struct ComplianceRecord {
        bool isVerified;
        uint256 identityCommitment;
        uint256 verifiedAt;
        uint256 expiresAt;
        uint256 ageThreshold;
    }

    // Mapping from user wallet address to compliance record
    mapping(address => ComplianceRecord) public complianceRecords;

    // Sybil resistance: Mapping from identity commitment hash to registered wallet
    mapping(uint256 => address) public commitmentToOwner;

    // Total number of verified unique users
    uint256 public totalVerifiedCount;

    // Events
    event ComplianceRegistered(
        address indexed user,
        uint256 indexed identityCommitment,
        uint256 ageThreshold,
        uint256 expiresAt
    );
    event ComplianceRevoked(address indexed user, uint256 indexed identityCommitment);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifier = IGroth16Verifier(_verifierAddress);
        owner = msg.sender;
    }

    /**
     * @notice Submit a Zero-Knowledge Groth16 proof to verify compliance
     * @param a Proof parameter A (G1 point)
     * @param b Proof parameter B (G2 point)
     * @param c Proof parameter C (G1 point)
     * @param input Public signals: [0] = isEligible (1), [1] = identityCommitment, [2] = ageThreshold
     */
    function registerCompliance(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input
    ) external returns (bool) {
        // 1. Verify eligibility signal
        require(input[0] == 1, "ZK-Compliance: Proof indicates user is not eligible");

        // 2. Verify age threshold meets system requirement
        require(input[2] >= MINIMUM_AGE_THRESHOLD, "ZK-Compliance: Age threshold is below protocol minimum");

        // 3. Verify cryptographic Groth16 zk-SNARK proof on-chain
        bool isValid = verifier.verifyProof(a, b, c, input);
        require(isValid, "ZK-Compliance: Cryptographic proof verification failed");

        uint256 commitment = input[1];

        // 4. Sybil Prevention: Ensure identity commitment has not been claimed by another wallet
        address existingOwner = commitmentToOwner[commitment];
        require(
            existingOwner == address(0) || existingOwner == msg.sender,
            "ZK-Compliance: Identity commitment already registered to another wallet"
        );

        if (!complianceRecords[msg.sender].isVerified) {
            totalVerifiedCount++;
        }

        uint256 expiresAt = block.timestamp + VALIDITY_PERIOD;

        // 5. Store record
        complianceRecords[msg.sender] = ComplianceRecord({
            isVerified: true,
            identityCommitment: commitment,
            verifiedAt: block.timestamp,
            expiresAt: expiresAt,
            ageThreshold: input[2]
        });

        commitmentToOwner[commitment] = msg.sender;

        emit ComplianceRegistered(msg.sender, commitment, input[2], expiresAt);
        return true;
    }

    /**
     * @notice Check if a user address holds an active, non-expired compliance status
     * @param user The address to check
     */
    function isUserCompliant(address user) external view returns (bool) {
        ComplianceRecord memory record = complianceRecords[user];
        return record.isVerified && block.timestamp < record.expiresAt;
    }

    /**
     * @notice Retrieve full compliance record for a user
     * @param user The address to query
     */
    function getComplianceRecord(address user) external view returns (ComplianceRecord memory) {
        return complianceRecords[user];
    }

    /**
     * @notice Allow a user to revoke their own compliance credential
     */
    function revokeSelf() external {
        ComplianceRecord memory record = complianceRecords[msg.sender];
        require(record.isVerified, "ZK-Compliance: No record to revoke");

        uint256 commitment = record.identityCommitment;
        delete complianceRecords[msg.sender];
        delete commitmentToOwner[commitment];
        totalVerifiedCount--;

        emit ComplianceRevoked(msg.sender, commitment);
    }
}
