import React, { useState } from 'react';

interface Team {
  name: string;
  hasWon: boolean;
}

const DiceRollPage: React.FC<{ winningTeams: Team[] }> = ({ winningTeams }) => {
  const [diceResults, setDiceResults] = useState<{ [key: string]: number | null }>({});

  const rollDice = (teamName: string) => {
    const result = Math.floor(Math.random() * 6) + 1;
    setDiceResults((prevResults) => ({
      ...prevResults,
      [teamName]: result,
    }));
  };

  return (
    <div className="dice-roll-page bg-red-50 min-h-screen p-8">
      <h1 className="text-3xl font-bold text-crimson-600 mb-6">Dice Roll Page</h1>
      <div className="space-y-6">
        {winningTeams.map((team) => (
          <div
            key={team.name}
            className="team-section bg-white shadow-md rounded-lg p-6 border border-crimson-200"
          >
            <h2 className="text-xl font-semibold text-crimson-700 mb-4">
              Dice roll for {team.name}
            </h2>
            <button
              onClick={() => rollDice(team.name)}
              className="roll-dice-button bg-crimson-500 text-white py-2 px-4 rounded hover:bg-crimson-600"
            >
              Roll Dice
            </button>
            {diceResults[team.name] !== undefined && (
              <p className="mt-4 text-lg font-medium text-crimson-800">
                Result: {diceResults[team.name]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiceRollPage;
