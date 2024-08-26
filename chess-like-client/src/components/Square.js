import React from 'react';

const Square = ({ value, isSelected, onClick }) => {
    const squareStyle = {
        width: '50px',
        height: '50px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        border: '1px solid black',
        backgroundColor: isSelected ? 'darkgray' : 'lightgray',
        color: isSelected ? '#FFD700' : 'black',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    };

    return (
        <button style={squareStyle} onClick={onClick}>
            {value ? value : ''}
        </button>
    );
};

export default Square;
