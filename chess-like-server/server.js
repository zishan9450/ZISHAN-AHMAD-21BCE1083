const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Define the board size and initial state
const BOARD_SIZE = 5;
let gameState = initializeGameState();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    if (gameState.gameOver) {
        ws.send(JSON.stringify({
            type: 'gameOver',
            winner: gameState.winner
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'init',
            data: gameState
        }));
    }

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        switch (parsedMessage.type) {
            case 'move':
                if (gameState.currentPlayer === parsedMessage.player) {
                    const moveResult = handleMove(parsedMessage.data, parsedMessage.player);
                    if (moveResult.valid) {
                        broadcastGameState();
                    } else {
                        ws.send(JSON.stringify({
                            type: 'invalidMove',
                            reason: moveResult.reason
                        }));
                    }
                }
                break;

            case 'reset':
                gameState = initializeGameState();
                broadcastGameState();
                break;

            default:
                console.warn('Unhandled message type:', parsedMessage.type);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Initialize the game state
function initializeGameState() {
    const initialBoard = createEmptyBoard(BOARD_SIZE);
    const playerA = initializePlayer('A');
    const playerB = initializePlayer('B');

    // Place Player A pieces
    Object.values(playerA).forEach(piece => {
        const [row, col] = piece.position;
        initialBoard[row][col] = piece;
    });

    // Place Player B pieces
    Object.values(playerB).forEach(piece => {
        const [row, col] = piece.position;
        initialBoard[row][col] = piece;
    });

    return {
        board: initialBoard,
        currentPlayer: 'A',
        players: { A: playerA, B: playerB },
        playerCounts: { A: Object.keys(playerA).length, B: Object.keys(playerB).length }, // Initialize counts
        gameOver: false,
        winner: null
    };
}



function createEmptyBoard(size) {
    const board = [];
    for (let i = 0; i < size; i++) {
        board.push(new Array(size).fill(null));
    }
    return board;
}

function initializePlayer(playerId) {
    if (playerId === 'A') {
        return {
            P1: { type: 'P1', position: [4, 0], player: playerId },
            P2: { type: 'P1', position: [4, 1], player: playerId },
            H1: { type: 'H1', position: [4, 2], player: playerId },
            H2: { type: 'H2', position: [4, 3], player: playerId },
            P3: { type: 'P1', position: [4, 4], player: playerId }
        };
    } else {
        return {
            P1: { type: 'P1', position: [0, 0], player: playerId },
            P2: { type: 'P1', position: [0, 1], player: playerId },
            H1: { type: 'H1', position: [0, 2], player: playerId },
            H2: { type: 'H2', position: [0, 3], player: playerId },
            P3: { type: 'P1', position: [0, 4], player: playerId }
        };
    }
}


function handleMove(moveData, playerId) {
    const { command, from } = moveData;
    const { character, direction } = parseMoveCommand(command);
    console.log(`Processing move: ${command} from position ${from} for Player ${playerId}`);

    if (!character || !direction) {
        console.log('Invalid move command format.');
        return { valid: false, reason: 'Invalid move command format.' };
    }

    const piece = getPieceAt(from, playerId);
    if (!piece || piece.type !== character) {
        console.log(`Character mismatch or does not exist at position ${from}`);
        return { valid: false, reason: 'Character does not exist or mismatch.' };
    }

    const to = getNewPosition(from, direction, piece.type, playerId);

    if (!isValidMove(from, to, piece, playerId, direction)) {
        console.log(`Move from ${from} to ${to} is invalid for character type ${piece.type}`);
        return { valid: false, reason: 'Invalid move.' };
    }

    // Process the move and update the game state
    gameState.board[to[0]][to[1]] = piece;
    gameState.board[from[0]][from[1]] = null;
    piece.position = to;

    // Handle combat
    const combatResult = handleCombat(from, to, piece, playerId);

    // Check if the game is over
    const opponentId = playerId === 'A' ? 'B' : 'A';
    if (isGameOver()) {
        gameState.gameOver = true;
        gameState.winner = playerId;
        broadcastGameState();
        broadcastMoveResult({ character, combatResult }, playerId, command); // Broadcast the move result
        return { valid: true, combatResult };
    }

    // Broadcast the move result for this move
    broadcastMoveResult({ character, combatResult }, playerId, command);

    // Switch turns if the game isn't over
    gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';

    broadcastGameState();

    return { valid: true, combatResult };
}

function broadcastMoveResult(moveResult, playerId, moveCommand) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'moveResult',
                data: {
                    piece: `${playerId}-${moveResult.character}`,
                    move: moveCommand,
                    combatResult: moveResult.combatResult,
                },
            }));
        }
    });
}


function parseMoveCommand(command) {
    if (typeof command !== 'string') {
        console.error('Invalid command format:', command);
        return { character: null, direction: null };
    }

    const [character, direction] = command.split(':');
    return { character, direction };
}



function getNewPosition(from, direction, characterType, playerId) {
    const [row, col] = from;
    
    // For Player B, reverse the perspective for forward and backward
    const forward = playerId === 'A' ? -1 : 1;
    const backward = playerId === 'A' ? 1 : -1;

    switch (characterType) {
        case 'P1': // Pawn
            switch (direction) {
                case 'L': return [row, col - 1];
                case 'R': return [row, col + 1];
                case 'F': return [row + forward, col];
                case 'B': return [row + backward, col];
                default: return null;
            }
        case 'H1': // Hero1
            switch (direction) {
                case 'L': return [row, col - 2];
                case 'R': return [row, col + 2];
                case 'F': return [row + (2 * forward), col];
                case 'B': return [row + (2 * backward), col];
                default: return null;
            }
        case 'H2': // Hero2
            switch (direction) {
                case 'FL': return [row + (2 * forward), col - 2];
                case 'FR': return [row + (2 * forward), col + 2];
                case 'BL': return [row + (2 * backward), col - 2];
                case 'BR': return [row + (2 * backward), col + 2];
                default: return null;
            }
        default:
            return null;
    }
}

function isValidMove(from, to, piece, playerId, direction) {
    if (!to) return false;
    const [toRow, toCol] = to;

    // Check if move is within bounds
    if (toRow < 0 || toRow >= BOARD_SIZE || toCol < 0 || toCol >= BOARD_SIZE) {
        console.log('Move out of bounds');
        return false;
    }

    // Check if target position is occupied by a friendly piece
    const targetPiece = gameState.board[toRow][toCol];
    if (targetPiece && targetPiece.player === playerId) {
        console.log('Move targets friendly piece');
        return false;
    }

    // Further validation based on the character's type
    const expectedPosition = getNewPosition(from, direction, piece.type, playerId);
    console.log(`Expected position: ${expectedPosition}`);
    return expectedPosition && expectedPosition[0] === to[0] && expectedPosition[1] === to[1];
}



function handleCombat(from, to, piece, playerId) {
    const opponentId = playerId === 'A' ? 'B' : 'A';
    const targetPiece = gameState.board[to[0]][to[1]];

    if (targetPiece && targetPiece.player === opponentId) {
        // Remove the opponent's piece
        gameState.board[to[0]][to[1]] = null;
        delete gameState.players[opponentId][targetPiece.type];
        
        // Decrease the opponent's player count
        gameState.playerCounts[opponentId]--;
        console.log(`Piece captured: ${targetPiece.type} by Player ${playerId}. New count for Player ${opponentId}: ${gameState.playerCounts[opponentId]}`);

        // Check if the opponent has any pieces left
        if (gameState.playerCounts[opponentId] === 0) {
            gameState.gameOver = true;
            gameState.winner = playerId;
            console.log(`Game Over. Winner: Player ${playerId}`);
            broadcastGameState();
        }
        return { captured: true, capturedPiece: targetPiece };
    }
    return { captured: false };
}


function removeOpponentsInPath(from, to, playerId) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const rowStep = fromRow < toRow ? 1 : (fromRow > toRow ? -1 : 0);
    const colStep = fromCol < toCol ? 1 : (fromCol > toCol ? -1 : 0);

    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (row !== toRow || col !== toCol) {
        removePieceAt([row, col], playerId);
        row += rowStep;
        col += colStep;
    }
}

function removePieceAt(position, playerId) {
    const [row, col] = position;
    const piece = gameState.board[row][col];

    if (piece && piece.player !== playerId) {
        gameState.board[row][col] = null;
        delete gameState.players[piece.player][piece.type];
    }
}

function isGameOver() {
    return gameState.playerCounts.A === 0 || gameState.playerCounts.B === 0;
}


function getPieceAt(position, playerId) {
    const [row, col] = position;
    const piece = gameState.board[row][col];

    return piece && piece.player === playerId ? piece : null;
}

function broadcastGameState() {
    const message = JSON.stringify({
        type: gameState.gameOver ? 'gameOver' : 'update',
        data: gameState,
    });

    console.log(`Broadcasting game state. Game Over: ${gameState.gameOver}. Current Player: ${gameState.currentPlayer}`);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}



// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
