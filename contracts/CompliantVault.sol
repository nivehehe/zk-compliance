// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IZKComplianceRegistry {
    function isUserCompliant(address user) external view returns (bool);
}

/**
 * @title CompliantVault
 * @dev An institutional DeFi yield vault that enforces Zero-Knowledge compliance.
 * Only addresses with active, unexpired ZK-Compliance credentials can deposit or earn yield.
 */
contract CompliantVault {
    IZKComplianceRegistry public immutable registry;
    address public owner;

    // Simulated 8.5% annual percentage yield (APY)
    uint256 public constant ANNUAL_YIELD_BPS = 850; // 8.5%
    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    struct Position {
        uint256 principal;
        uint256 depositTimestamp;
        uint256 lastAccruedTimestamp;
        uint256 accumulatedYield;
    }

    mapping(address => Position) public positions;
    uint256 public totalVaultDeposits;

    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 principal, uint256 yieldEarned, uint256 timestamp);
    event YieldClaimed(address indexed user, uint256 yieldAmount);

    modifier onlyCompliant() {
        require(
            registry.isUserCompliant(msg.sender),
            "CompliantVault: KYC/AML compliance verification required via ZK-Proof"
        );
        _;
    }

    constructor(address _registryAddress) {
        require(_registryAddress != address(0), "Invalid registry address");
        registry = IZKComplianceRegistry(_registryAddress);
        owner = msg.sender;
    }

    /**
     * @notice Deposit ETH into the compliant vault
     */
    function deposit() external payable onlyCompliant {
        require(msg.value > 0, "CompliantVault: Deposit amount must be greater than 0");

        Position storage pos = positions[msg.sender];
        if (pos.principal > 0) {
            uint256 pending = calculatePendingYield(msg.sender);
            pos.accumulatedYield += pending;
        }

        pos.principal += msg.value;
        pos.depositTimestamp = block.timestamp;
        pos.lastAccruedTimestamp = block.timestamp;
        totalVaultDeposits += msg.value;

        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Calculate accrued yield for an address
     */
    function calculatePendingYield(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.principal == 0) return 0;

        uint256 timeElapsed = block.timestamp - pos.lastAccruedTimestamp;
        uint256 annualYield = (pos.principal * ANNUAL_YIELD_BPS) / BPS_DIVISOR;
        return (annualYield * timeElapsed) / SECONDS_PER_YEAR;
    }

    /**
     * @notice Withdraw principal and accrued yield
     */
    function withdraw(uint256 amount) external onlyCompliant {
        Position storage pos = positions[msg.sender];
        require(pos.principal >= amount, "CompliantVault: Insufficient balance");

        uint256 pendingYield = calculatePendingYield(msg.sender);
        uint256 totalPayout = amount + pendingYield + pos.accumulatedYield;

        pos.principal -= amount;
        pos.accumulatedYield = 0;
        pos.lastAccruedTimestamp = block.timestamp;
        totalVaultDeposits -= amount;

        (bool success, ) = msg.sender.call{value: totalPayout}("");
        require(success, "CompliantVault: Transfer failed");

        emit Withdrawn(msg.sender, amount, pendingYield, block.timestamp);
    }

    /**
     * @notice Fallback to accept funding for yield reserve
     */
    receive() external payable {}
}
