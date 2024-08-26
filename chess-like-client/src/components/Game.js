import React, { useEffect, useState } from 'react';
import GameBoard from './GameBoard';
import MovementGuide from './MovementGuide';

const Game = () => {
    const [ws, setWs] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [winner, setWinner] = useState(null); // Add this line

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');

        socket.onopen = () => {
            console.log('Connected to server');
            setWs(socket);
        };

        socket.onmessage = (message) => {
            const parsedMessage = JSON.parse(message.data);
            handleServerMessage(parsedMessage);
        };

        socket.onclose = () => {
            console.log('Disconnected from server');
        };

        return () => {
            socket.close();
        };
    }, []);

    const handleServerMessage = (message) => {
        switch (message.type) {
            case 'init':
            case 'update':
                setGameState(message.data);
                break;
    
            case 'gameOver':
                setGameState(message.data);
                setWinner(message.data.winner);  // Set the winner when the game is over
                break;
    
            case 'invalidMove':
                alert(`Invalid move: ${message.reason}`);
                break;
            
            case 'moveResult':
            const moveDescription = `${message.data.piece}: ${message.data.move}`;
            if (message.data.combatResult.captured) {
                const captureDescription = ` (Captured ${message.data.combatResult.capturedPiece.player}-${message.data.combatResult.capturedPiece.type})`;
                setMoveHistory(prevHistory => [...prevHistory, moveDescription + captureDescription]);
            } else {
                setMoveHistory(prevHistory => [...prevHistory, moveDescription]);
            }
            break;
    
            default:
                console.warn('Unhandled message type:', message.type);
        }
    };


    const handleSquareClick = (rowIndex, colIndex) => {
        if (!selectedPiece) {
            const piece = gameState.board[rowIndex][colIndex];
            if (piece && piece.player === gameState.currentPlayer) {
                setSelectedPiece({ name: `${piece.player}-${piece.type}`, position: [rowIndex, colIndex] });
            }
        } else {
            // Handle move based on square click
            const moveData = {
                from: selectedPiece.position,
                to: [rowIndex, colIndex]
            };
            sendMove(moveData);
            setSelectedPiece(null);
        }
    };

    const onMoveButtonClick = (move) => {
        if (selectedPiece) {
            const characterType = selectedPiece.name.split('-')[1];
            const moveCommand = `${characterType}:${move}`;
            
            // Log the correct move to the move history
            setMoveHistory(prevHistory => [...prevHistory, `${selectedPiece.name}: ${move}`]);
    
            sendMove({ command: moveCommand, from: selectedPiece.position });
            setSelectedPiece(null);
        }
    };
    
    

    const sendMove = (moveData) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'move',
                player: gameState.currentPlayer,
                data: moveData
            }));
        }
    };
    

    const getValidMoves = () => {
        if (!selectedPiece) return [];
        const pieceType = selectedPiece.name.split('-')[1];
        switch (pieceType) {
            case 'P1':
                return ['L', 'R', 'F', 'B'];
            case 'H1':
                return ['L', 'R', 'F', 'B'];
            case 'H2':
                return ['FL', 'FR', 'BL', 'BR'];
            default:
                return [];
        }
    };

    return (
        <div style={gameContainerStyle}>
        <h1>Advanced Chess-like Game</h1>
        {winner ? (
            <div>
                <h2>{`Player ${winner} wins!`}</h2>
            </div>
        ) : (
            <>
                <h2>Current Player: {gameState?.currentPlayer}</h2>
                {gameState && (
                    <GameBoard
                        board={gameState.board}
                        selectedPiece={selectedPiece}
                        validMoves={getValidMoves()}
                        onSquareClick={handleSquareClick}
                        onMoveButtonClick={onMoveButtonClick}
                        currentPlayer={gameState.currentPlayer}
                    />
                )}
            </>
        )}
        <div style={historyContainerStyle}>
            <h3>Move History</h3>
            <ul>
                {moveHistory.map((move, index) => (
                    <li key={index}>{move}</li>
                ))}
            </ul>
        </div>
        <MovementGuide />
        </div>
    );
};

const gameContainerStyle = {
    color: 'white',
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '10px',
};


const historyContainerStyle = {
    marginTop: '20px',
};

export default Game;
