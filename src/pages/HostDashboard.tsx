
import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Copy, Users, Trophy, Play, Gift } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { startGame } from "@/services/gameSession";

const HostDashboard = () => {
  const { 
    nickname,
    gameSession,
    startNewSession,
    teams,
    roundResults,
    currentRound
  } = useQuiz();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Redirect if not host
  useEffect(() => {
    if (!nickname || nickname !== "HOST") {
      navigate("/");
    }
  }, [nickname, navigate]);

  // Auto-create session when host loads dashboard
  useEffect(() => {
    const initializeSession = async () => {
      if (!gameSession) {
        try {
          const newSessionId = await startNewSession();
          setSessionId(newSessionId);
        } catch (error) {
          console.error('Failed to create session:', error);
        }
      } else {
        setSessionId(gameSession.id);
        setGameStarted(gameSession.status === 'started' || gameSession.status === 'in-progress');
      }
    };

    initializeSession();
  }, [gameSession, startNewSession]);

  const handleCopySessionCode = async () => {
    if (sessionId) {
      try {
        await navigator.clipboard.writeText(sessionId);
        setCopiedToClipboard(true);
        toast({
          title: "Session code copied!",
          description: "Share this code with players to join the game.",
          duration: 2000,
        });
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please copy the code manually.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStartGame = async () => {
    if (!sessionId) return;
    
    try {
      await startGame(sessionId);
      setGameStarted(true);
      toast({
        title: "Game Started!",
        description: "All players can now begin answering questions.",
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      toast({
        title: "Failed to start game",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScratchCardGame = () => {
    navigate("/scratch-card");
  };

  const getTotalPlayers = () => {
    if (!gameSession) return 0;
    return Object.keys(gameSession.players || {}).length - 1; // Exclude host
  };

  const getTeamPlayers = (teamId: string) => {
    if (!gameSession) return [];
    return Object.values(gameSession.players || {})
      .filter(player => player.teamId === teamId && !player.isHost)
      .map(player => player.nickname);
  };

  const getRoundWinner = (round: number) => {
    const result = roundResults.find(r => r.roundNumber === round);
    return result?.winningTeam || null;
  };

  const canStartGame = () => {
    return getTotalPlayers() > 0 && !gameStarted;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Host Dashboard</h1>
          {/* Permanent Scratch Card Link - Always Visible to Host */}
          <Button
            onClick={handleScratchCardGame}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Gift className="h-4 w-4 mr-2" />
            Play Scratch Rewards
          </Button>
        </div>
      </header>

      <main className="container p-6 space-y-6">
        {/* Session Code Card */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Session Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-6 py-3 rounded-lg text-2xl font-mono tracking-wider">
                {sessionId || 'Generating...'}
              </div>
              <Button
                variant="outline"
                onClick={handleCopySessionCode}
                className={`transition-all ${copiedToClipboard ? 'bg-green-500 text-white' : 'hover:bg-white/20'}`}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-white/70 mb-4">
              Share this code with players to join the game
            </p>
            
            {/* Control Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleStartGame}
                disabled={!canStartGame()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {gameStarted ? 'Game Started' : 'Start Game'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Player Overview */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              Players ({getTotalPlayers()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map((team) => {
                const teamPlayers = getTeamPlayers(team.id);
                return (
                  <div key={team.id} className="bg-white/5 rounded-lg p-4">
                    <div className={`w-8 h-8 ${team.color} rounded-full mb-2`}></div>
                    <h3 className="font-semibold text-white mb-2">{team.name}</h3>
                    <p className="text-sm text-white/70 mb-2">
                      {teamPlayers.length} / {team.maxPlayers} players
                    </p>
                    <div className="space-y-1">
                      {teamPlayers.map((playerName) => (
                        <div key={playerName} className="text-sm text-white/80">
                          {playerName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Round Results */}
        {roundResults.length > 0 && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Round Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((round) => {
                  const winner = getRoundWinner(round);
                  const isCompleted = winner !== null;
                  
                  return (
                    <div key={round} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <span className="font-medium">Round {round}</span>
                      {isCompleted ? (
                        <span className="text-green-400 font-semibold">
                          Winner: {teams.find(t => t.name === winner)?.name || winner}
                        </span>
                      ) : round === currentRound ? (
                        <span className="text-yellow-400">In Progress</span>
                      ) : (
                        <span className="text-white/50">Pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default HostDashboard;
