import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Copy } from "lucide-react";

const TeamSelection = () => {
  const { 
    nickname, 
    teams, 
    joinTeam, 
    selectedTeam,
    startNewSession,
    joinExistingSession,
    gameSession,
    sessionError,
    isSessionHost
  } = useQuiz();
  const navigate = useNavigate();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [sessionCode, setSessionCode] = useState<string>('');
  const [isStartingNewSession, setIsStartingNewSession] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

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

  const handleStartSession = async () => {
    try {
      setIsStartingNewSession(true);
      const sessionId = await startNewSession();
      setSessionCode(sessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsStartingNewSession(false);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) return;

    try {
      await joinExistingSession(sessionCode);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleJoinTeam = async () => {
    if (!selectedTeamId || !gameSession) {
      return;
    }

    try {
      const selectedTeamData = gameSession.teams[selectedTeamId];
      if (!selectedTeamData) {
        throw new Error('Selected team not found');
      }

      if (selectedTeamData.playerCount >= selectedTeamData.maxPlayers) {
        throw new Error('This team is full');
      }

      await joinTeam(selectedTeamId);
      
      toast({
        title: "Team joined successfully!",
        description: "Redirecting to game setup...",
      });
      
      // Navigate immediately after successful join
      navigate("/onboarding");
    } catch (error) {
      console.error('Failed to join team:', error);
      toast({
        title: "Failed to join team",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCopySessionCode = async () => {
    if (gameSession?.id) {
      try {
        await navigator.clipboard.writeText(gameSession.id);
        setCopiedToClipboard(true);
        toast({
          title: "Session code copied!",
          description: "You can now share it with other players.",
          duration: 2000,
        });
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please try copying the code manually.",
          variant: "destructive",
        });
      }
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
            <h1 className="text-3xl font-bold mb-4">
              {!gameSession ? "Join a Quiz Game" : "Game Setup"}
            </h1>

            {/* Show session code prominently if hosting */}
            {gameSession && isSessionHost && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-4">Share This Game</h2>
                <div className="space-y-4">
                  <p className="text-white/80">Share this session code with other players:</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-white/20 px-6 py-3 rounded-lg text-2xl font-mono tracking-wider">
                      {gameSession.id}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySessionCode}
                      className={`transition-all ${copiedToClipboard ? 'bg-green-500 text-white' : 'hover:bg-white/20'}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {copiedToClipboard && (
                    <p className="text-green-400 text-sm">Copied to clipboard!</p>
                  )}
                </div>
              </div>
            )}

            {!gameSession ? (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
                  <h2 className="text-xl font-bold mb-4">
                    {isStartingNewSession ? "Creating new session..." : "Join or Start a Session"}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Enter Session Code"
                          value={sessionCode}
                          onChange={(e) => setSessionCode(e.target.value)}
                          className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                        />
                        <Button 
                          onClick={handleJoinSession}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          Join Session
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow border-t border-white/20"></div>
                        <span className="text-white/60">or</span>
                        <div className="flex-grow border-t border-white/20"></div>
                      </div>
                      <Button 
                        onClick={handleStartSession}
                        variant="outline"
                        disabled={isStartingNewSession}
                      >
                        {isStartingNewSession ? 'Creating...' : 'Start New Game Session'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xl mb-8">Choose your team to begin</p>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamSelection;
