import React, { useEffect, useState } from 'react';

const WebSocketClient = () => {
    const [ws, setWs] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState(null);

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

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('WebSocket error');
        };

        return () => {
            socket.close();
        };
    }, []);

    const handleServerMessage = (message) => {
        switch (message.type) {
            case 'init':
                setGameState(message.data);
                break;

            case 'update':
                setGameState(message.data);
                break;

            case 'error':
                setError(message.message);
                break;

            // Add more case handlers as needed
            default:
                console.warn('Unhandled message type:', message.type);
        }
    };

    const sendMove = (moveData) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'move',
                data: moveData
            }));
        }
    };

    return (
        <div>
            <h1>Chess-like Game</h1>
            {error && <p>Error: {error}</p>}
            {/* Render the game board and controls here */}
            {/* Example: */}
            <button onClick={() => sendMove({ from: 'A2', to: 'A3' })}>Move</button>
            {/* Add more UI components as needed */}
        </div>
    );
};

export default WebSocketClient;
