
import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

const TeamSelection = () => {
  const { nickname, teams, joinTeam, selectedTeam } = useQuiz();
  const navigate = useNavigate();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  // Redirect to home if no nickname is set
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    }
  }, [nickname, navigate]);

  const handleTeamSelect = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && team.playerCount < team.maxPlayers) {
      setSelectedTeamId(teamId);
    }
  };

  const handleJoinTeam = () => {
    if (selectedTeamId) {
      joinTeam(selectedTeamId);
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Quiz Game - Team Selection</h2>
          <div className="bg-white/20 px-4 py-2 rounded-full">
            <span className="font-medium">Playing as: </span>
            <span className="font-bold">{nickname}</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Choose Your Team</h1>
            <p className="text-xl text-quiz-red-100">
              Select a team to join the quiz. Teams with 7 players are full.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {teams.map((team) => {
              const isFull = team.playerCount >= team.maxPlayers;
              const isSelected = selectedTeamId === team.id;
              
              return (
                <Card 
                  key={team.id}
                  className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isSelected 
                      ? 'ring-4 ring-white bg-white/20' 
                      : 'bg-white/10 hover:bg-white/15'
                  } ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isFull && handleTeamSelect(team.id)}
                >
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${team.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white">
                        {team.name.split(' ')[1][0]}
                      </span>
                    </div>
                    <CardTitle className="text-white text-xl">
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-2">
                      <p className="text-quiz-red-100">
                        {team.playerCount} / {team.maxPlayers} players
                      </p>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className={`${team.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${(team.playerCount / team.maxPlayers) * 100}%` }}
                        />
                      </div>
                      {isFull && (
                        <p className="text-red-300 font-medium">Team Full</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center">
            <Button
              onClick={handleJoinTeam}
              disabled={!selectedTeamId}
              className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-medium px-8 py-3 text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Join Team
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamSelection;
