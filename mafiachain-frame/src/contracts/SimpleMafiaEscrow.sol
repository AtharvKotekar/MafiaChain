// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleMafiaEscrow
 * @dev Ultra-simple escrow contract for MafiaChain game
 */
contract SimpleMafiaEscrow is ReentrancyGuard, Ownable {
    uint256 public constant ENTRY_FEE = 0.001 ether; // Testnet amount
    uint256 public constant MAX_PLAYERS = 9;
    uint256 public constant DISPUTE_WINDOW = 1 hours; // Shortened for testing

    struct Game {
        string gameId;
        address[] players;
        mapping(address => bool) isPlayer;
        uint256 balance;
        bool started;
        uint256 startTime;
        bool finalized;
        address[] winners;
    }

    mapping(string => Game) public games;
    mapping(address => uint256) public playerGameCounts;

    event GameCreated(string indexed gameId, address indexed creator);
    event PlayerJoined(string indexed gameId, address indexed player, uint256 playerCount);
    event GameStarted(string indexed gameId, uint256 startTime);
    event GameFinalized(string indexed gameId, address[] winners, uint256 totalPayout);
    event EmergencyRefund(string indexed gameId, address indexed player, uint256 amount);

    error GameNotFound();
    error WrongEntryFee();
    error GameAlreadyStarted();
    error GameFull();
    error AlreadyJoined();
    error GameNotStarted();
    error GameAlreadyFinalized();
    error DisputeWindowActive();
    error NotAuthorized();
    error NoWinners();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new game
     */
    function createGame(string calldata gameId) external {
        if (bytes(games[gameId].gameId).length != 0) {
            revert GameNotFound();
        }

        games[gameId].gameId = gameId;
        emit GameCreated(gameId, msg.sender);
    }

    /**
     * @dev Join a game by paying entry fee
     */
    function joinGame(string calldata gameId) external payable nonReentrant {
        if (msg.value != ENTRY_FEE) revert WrongEntryFee();

        Game storage game = games[gameId];
        if (bytes(game.gameId).length == 0) revert GameNotFound();
        if (game.started) revert GameAlreadyStarted();
        if (game.players.length >= MAX_PLAYERS) revert GameFull();
        if (game.isPlayer[msg.sender]) revert AlreadyJoined();

        game.players.push(msg.sender);
        game.isPlayer[msg.sender] = true;
        game.balance += msg.value;
        playerGameCounts[msg.sender]++;

        emit PlayerJoined(gameId, msg.sender, game.players.length);
    }

    /**
     * @dev Start the game (only owner/backend)
     */
    function startGame(string calldata gameId) external onlyOwner {
        Game storage game = games[gameId];
        if (bytes(game.gameId).length == 0) revert GameNotFound();
        if (game.started) revert GameAlreadyStarted();
        if (game.players.length != MAX_PLAYERS) revert GameFull();

        game.started = true;
        game.startTime = block.timestamp;

        emit GameStarted(gameId, block.timestamp);
    }

    /**
     * @dev Finalize game and distribute winnings
     */
    function finalizeGame(string calldata gameId, address[] calldata winners)
        external
        onlyOwner
        nonReentrant
    {
        Game storage game = games[gameId];
        if (bytes(game.gameId).length == 0) revert GameNotFound();
        if (!game.started) revert GameNotStarted();
        if (game.finalized) revert GameAlreadyFinalized();
        if (block.timestamp < game.startTime + DISPUTE_WINDOW) revert DisputeWindowActive();
        if (winners.length == 0) revert NoWinners();

        // Validate winners are players
        for (uint256 i = 0; i < winners.length; i++) {
            if (!game.isPlayer[winners[i]]) revert NotAuthorized();
        }

        uint256 totalPayout = game.balance;
        uint256 payoutPerWinner = totalPayout / winners.length;

        game.finalized = true;
        game.winners = winners;

        // Distribute winnings
        for (uint256 i = 0; i < winners.length; i++) {
            (bool success, ) = payable(winners[i]).call{value: payoutPerWinner}("");
            if (!success) revert TransferFailed();
        }

        emit GameFinalized(gameId, winners, totalPayout);
    }

    /**
     * @dev Emergency refund for all players (admin only)
     */
    function emergencyRefund(string calldata gameId) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        if (bytes(game.gameId).length == 0) revert GameNotFound();
        if (game.finalized) revert GameAlreadyFinalized();

        uint256 refundAmount = ENTRY_FEE;

        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            (bool success, ) = payable(player).call{value: refundAmount}("");
            if (!success) revert TransferFailed();

            emit EmergencyRefund(gameId, player, refundAmount);
        }

        game.finalized = true;
        game.balance = 0;
    }

    /**
     * @dev Get game info
     */
    function getGameInfo(string calldata gameId)
        external
        view
        returns (
            address[] memory players,
            uint256 balance,
            bool started,
            uint256 startTime,
            bool finalized,
            address[] memory winners
        )
    {
        Game storage game = games[gameId];
        return (
            game.players,
            game.balance,
            game.started,
            game.startTime,
            game.finalized,
            game.winners
        );
    }

    /**
     * @dev Check if address is player in game
     */
    function isPlayerInGame(string calldata gameId, address player)
        external
        view
        returns (bool)
    {
        return games[gameId].isPlayer[player];
    }

    /**
     * @dev Get total contract balance (for monitoring)
     */
    function getTotalBalance() external view returns (uint256) {
        return address(this).balance;
    }
}