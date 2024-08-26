import React from 'react';
import Square from './Square';

const GameBoard = ({ board, onSquareClick, selectedPiece, validMoves, onMoveButtonClick, currentPlayer }) => {
    return (
        <div style={gameContainerStyle}>
            <h2>Current Player: {currentPlayer}</h2>
            <div style={boardStyle}>
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} style={rowStyle}>
                        {row.map((cell, colIndex) => (
                            <Square
                                key={`${rowIndex}-${colIndex}`}
                                value={cell ? `${cell.player}-${cell.type}` : ''}
                                isSelected={selectedPiece && selectedPiece.position[0] === rowIndex && selectedPiece.position[1] === colIndex}
                                onClick={() => onSquareClick(rowIndex, colIndex)}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div>
                {selectedPiece && (
                    <>
                        <h3>Selected: {selectedPiece.name}</h3>
                        <div style={buttonContainerStyle}>
                            {validMoves.map(move => (
                                <button key={move} style={buttonStyle} onClick={() => onMoveButtonClick(move)}>
                                    {move}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const gameContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'white',
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '10px',
};

const boardStyle = {
    display: 'flex',
    flexDirection: 'column',
    margin: '20px 0',
};

const rowStyle = {
    display: 'flex',
};

const buttonContainerStyle = {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
};

const buttonStyle = {
    margin: '0 5px',
    padding: '10px',
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
};

export default GameBoard;
