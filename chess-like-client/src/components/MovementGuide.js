import React from 'react';

const MovementGuide = () => {
    return (
        <div style={guideContainerStyle}>
            <h3>Piece Movement Guide</h3>
            <ul>
                <li>Pawn (P): Moves 1 step in any direction</li>
                <li>Hero1 (H1): Moves 2 steps in any direction</li>
                <li>Hero2 (H2): Moves 2 steps diagonally</li>
                <li>Hero3 (H3): Moves 2 steps in one direction, then 1 step perpendicular</li>
            </ul>
        </div>
    );
};

const guideContainerStyle = {
    marginTop: '20px',
    color: 'white',
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '10px',
};

export default MovementGuide;
