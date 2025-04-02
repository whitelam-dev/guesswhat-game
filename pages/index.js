import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { db, auth } from "@/lib/firebaseClient";

const generateLobbyCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

const GuessWhat = () => {
    const [playerName, setPlayerName] = useState("");
    const [enteredLobby, setEnteredLobby] = useState(false);
    const [images, setImages] = useState([]);
    const [targetIndex, setTargetIndex] = useState(null);
    const [deselections, setDeselections] = useState([]);
    const [isGuessing, setIsGuessing] = useState(false);
    const [guessIndex, setGuessIndex] = useState(null);
    const [victory, setVictory] = useState(false);
    const [turn, setTurn] = useState("player1");
    const [playerId] = useState(() => uuidv4());
    const [lobbyCode, setLobbyCode] = useState("");
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        if (auth) auth;
    }, []);

    const createLobby = async () => {
        const { doc, setDoc } = await import("firebase/firestore");

        const code = generateLobbyCode();
        const randomIndexes = new Set();
        while (randomIndexes.size < 25) {
            randomIndexes.add(Math.floor(Math.random() * 10000));
        }
        const imageSet = Array.from(randomIndexes).map(
            seed => `https://picsum.photos/seed/${seed}/200/200`
        );

        const player1Target = Math.floor(Math.random() * 25);
        let player2Target = Math.floor(Math.random() * 25);
        while (player2Target === player1Target) {
            player2Target = Math.floor(Math.random() * 25);
        }

        await setDoc(doc(db, "lobbies", code), {
            images: imageSet,
            player1Target,
            player2Target,
            deselections: { player1: [], player2: [] },
            turn: "player1",
            victory: false,
            guesses: { player1: null, player2: null },
        });

        setLobbyCode(code);
        setImages(imageSet);
        setTargetIndex(player1Target);
        setTurn("player1");
        setIsHost(true);
        setEnteredLobby(true);
    };

    const joinLobby = async () => {
        const { doc, getDoc, onSnapshot } = await import("firebase/firestore");
        const ref = doc(db, "lobbies", lobbyCode);
        const snap = await getDoc(ref);
        if (!snap.exists()) return alert("Lobby not found");
        const data = snap.data();
        setImages(data.images);
        setTargetIndex(data.player2Target);
        setTurn(data.turn);

        onSnapshot(ref, (docSnap) => {
            const d = docSnap.data();
            setDeselections(d.deselections[isHost ? "player1" : "player2"] || []);
            setVictory(d.victory);
            setTurn(d.turn);
        });

        if (data.images?.length === 25) {
            setEnteredLobby(true);
        } else {
            alert("Lobby data invalid or incomplete.");
        }
    };

    const isPlayerTurn = turn === (isHost ? "player1" : "player2");

    const toggleDeselection = async (index) => {
        const { doc, updateDoc } = await import("firebase/firestore");
        if (victory || isGuessing || !isPlayerTurn || index === targetIndex) return;
        const current = [...deselections];
        const found = current.indexOf(index);
        if (found > -1) {
            current.splice(found, 1);
        } else {
            current.push(index);
        }
        setDeselections(current);
        await updateDoc(doc(db, "lobbies", lobbyCode), {
            [`deselections.${isHost ? "player1" : "player2"}`]: current,
        });
    };

    const guess = async (index) => {
        const { doc, updateDoc, getDoc } = await import("firebase/firestore");
        if (victory || !isGuessing || !isPlayerTurn) return;

        const ref = doc(db, "lobbies", lobbyCode);
        const snap = await getDoc(ref);
        const data = snap.data();

        const guessKey = isHost ? "player1" : "player2";
        if (data.guesses[guessKey] !== null) return;

        setGuessIndex(index);

        const opponentTarget = isHost ? data.player2Target : data.player1Target;
        const isCorrect = index === opponentTarget;

        await updateDoc(ref, {
            [`guesses.${guessKey}`]: index,
            victory: isCorrect,
            turn: isCorrect ? turn : isHost ? "player2" : "player1",
        });

        if (isCorrect) setVictory(true);
    };

    const endTurn = async () => {
        const { doc, updateDoc } = await import("firebase/firestore");
        if (!isPlayerTurn) return;
        const guessKey = isHost ? "player1" : "player2";

        await updateDoc(doc(db, "lobbies", lobbyCode), {
            turn: isHost ? "player2" : "player1",
            [`guesses.${guessKey}`]: null,
        });

        setIsGuessing(false);
        setGuessIndex(null);
    };

    const copyLobbyCode = () => {
        if (lobbyCode) navigator.clipboard.writeText(lobbyCode);
    };

    const resetGame = () => {
        setEnteredLobby(false);
        setImages([]);
        setTargetIndex(null);
        setDeselections([]);
        setIsGuessing(false);
        setGuessIndex(null);
        setVictory(false);
        setTurn("player1");
        setLobbyCode("");
        setIsHost(false);
    };

    if (!enteredLobby) {
        return (
            <div className="min-h-screen bg-[#2B2D31] text-white flex flex-col items-center justify-center gap-4">
                <input
                    className="bg-gray-800 p-2 rounded-lg text-center shadow-md"
                    placeholder="Your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                />
                <input
                    className="bg-gray-800 p-2 rounded-lg text-center shadow-md"
                    placeholder="Lobby Code (Leave empty to create)"
                    value={lobbyCode}
                    onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                />
                <Button
                    onClick={() => (lobbyCode ? joinLobby() : createLobby())}
                    className="rounded-lg shadow-lg hover:bg-purple-700 transition"
                >
                    {lobbyCode ? "Join Lobby" : "Create Lobby"}
                </Button>
            </div>
        );
    }

    if (enteredLobby && images.length < 25) {
        return (
            <div className="min-h-screen bg-[#2B2D31] text-white flex flex-col items-center justify-center">
                <p className="text-lg font-semibold mb-2">Loading images...</p>
                <div className="animate-pulse text-gray-400">Please wait...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#2B2D31] text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2">YOUR IMAGE</h2>
                    {images[targetIndex] && (
                        <div className="w-32 h-32 border-4 border-green-400 rounded-xl overflow-hidden">
                            <img
                                src={images[targetIndex]}
                                className="w-full h-full object-cover"
                                alt="Your target"
                            />
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-lg font-semibold text-gray-300">Lobby Code:</p>
                    <div className="flex items-center justify-end gap-2">
                        <p className="text-xl font-bold tracking-wide text-white">
                            {lobbyCode}
                        </p>
                        <button
                            onClick={copyLobbyCode}
                            className="bg-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-600"
                        >
                            Copy
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-yellow-400 font-bold">
                        {isPlayerTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
                    </p>
                </div>
            </div>

            <div className="flex justify-center gap-4 mb-6">
                <Button
                    onClick={() => setIsGuessing(!isGuessing)}
                    className="rounded-full px-6 py-2 shadow-md hover:scale-105 transition-all"
                >
                    {isGuessing ? "Cancel Guess" : "GUESS"}
                </Button>
                <Button
                    className={`rounded-full px-6 py-2 shadow-md hover:scale-105 transition-all ${isPlayerTurn ? "opacity-100" : "opacity-15"
                        }`}
                    onClick={endTurn}
                >
                    END TURN
                </Button>
            </div>

            <div className="grid grid-cols-5 gap-4">
                {images.map((url, idx) => {
                    const isDeselected = deselections.includes(idx);
                    const isTarget = idx === targetIndex;
                    const isGuessed = idx === guessIndex;
                    return (
                        <div
                            key={idx}
                            className={`relative w-full h-full rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform hover:scale-105`}
                        >
                            <img
                                src={url}
                                className="w-full h-full object-cover cursor-pointer rounded-xl"
                                onClick={() =>
                                    isGuessing ? guess(idx) : toggleDeselection(idx)
                                }
                            />
                            {isDeselected && (
                                <div className="absolute inset-0 bg-red-500/20 backdrop-blur-md rounded-xl pointer-events-none" />
                            )}
                            {isTarget && (
                                <div className="absolute inset-0 bg-green-400/20 backdrop-blur-md rounded-xl pointer-events-none border-2 border-green-400" />
                            )}
                            {isGuessing && isGuessed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 backdrop-blur-sm rounded-xl pointer-events-none">
                                    <span className="text-6xl text-green-400 font-black">✔</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {victory && (
                <div className="flex justify-center mt-6">
                    <Button
                        onClick={resetGame}
                        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-full"
                    >
                        Restart Game
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GuessWhat;

