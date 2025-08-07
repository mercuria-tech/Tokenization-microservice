// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract AssetSecurityToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    // Partitioned balances (for demo, not full ERC-1400)
    mapping(address => mapping(bytes32 => uint256)) private _partitions;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount, bytes32 partition) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        _partitions[to][partition] += amount;
    }

    function burn(address from, uint256 amount, bytes32 partition) public onlyRole(BURNER_ROLE) {
        _burn(from, amount);
        require(_partitions[from][partition] >= amount, "Insufficient partition balance");
        _partitions[from][partition] -= amount;
    }

    function balanceOfByPartition(address account, bytes32 partition) public view returns (uint256) {
        return _partitions[account][partition];
    }
}
