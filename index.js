const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let players = [];
let isRevealed = false;

const INACTIVITY_LIMIT = 600000;

// Função para atualizar o lastActivityTime de um jogador
function updatePlayerActivity(id) {
  players = players.map((player) =>
    player.id === id ? { ...player, lastActivityTime: Date.now() } : player
  );
}

// Função para remover jogadores inativos
function removeInactivePlayers() {
  const now = Date.now();
  players = players.filter(
    (player) => now - player.lastActivityTime < INACTIVITY_LIMIT
  );
}

// Intervalo que executa a remoção de inativos a cada 30 segundos
setInterval(removeInactivePlayers, 30000);

// Posições disponíveis para os jogadores
const availablePositions = [
  { top: "7rem", left: "37rem" },
  { top: "7rem", left: "65rem" },
  { top: "7rem", left: "25rem" },
  { top: "7rem", left: "78rem" },
  { top: "10rem", left: "15rem" },
  { top: "10rem", left: "90rem" },
  { top: "15rem", left: "7rem" },
  { top: "15rem", left: "98rem" },
  { top: "20rem", left: "3rem" },
  { top: "20rem", left: "100rem" },
  { top: "25rem", left: "7rem" },
  { top: "25rem", left: "98rem" },
];

// Obter lista de jogadores
app.get("/players", (req, res) => {
  res.json(players);
});

// Adicionar um jogador
app.post("/join", (req, res) => {
  const { name, role } = req.body;
  const positionIndex = players.length % availablePositions.length;
  const newPlayer = {
    id: Date.now(),
    name,
    role,
    selectedCard: null,
    hasVoted: false,
    isRevealed: false,
    position: availablePositions[positionIndex],
    lastActivityTime: Date.now(),
  };
  players.push(newPlayer);
  res.status(201).json(newPlayer);
});

// Selecionar uma carta
app.post("/select-card", (req, res) => {
  const { id, selectedCard } = req.body;
  let found = false;
  players = players.map((player) => {
    if (player.id === id) {
      found = true;
      return {
        ...player,
        selectedCard,
        hasVoted: true,
        lastActivityTime: Date.now(),
      };
    }
    return player;
  });
  if (found) res.status(200).send({ message: "Carta atualizada" });
  else res.status(404).send({ message: "Jogador não encontrado" });
});

// Revelar cartas
app.post("/reveal-cards", (req, res) => {
  isRevealed = true;
  players = players.map((player) => ({
    ...player,
    isRevealed: true,
    lastActivityTime: Date.now(),
  }));
  res.status(200).send();
});

// Resetar o jogo
app.post("/new-game", (req, res) => {
  isRevealed = false;
  players = players.map((player) => ({
    ...player,
    selectedCard: null,
    hasVoted: false,
    isRevealed: false,
    lastActivityTime: Date.now(),
  }));
  res.status(200).send();
});

// Remover um jogador manualmente
app.post("/leave", (req, res) => {
  const { id } = req.body;
  players = players.filter((player) => player.id !== id);
  res.status(200).send({ message: "Jogador removido" });
});

app.post("/close-reveal", (req, res) => {
  isRevealed = false;
  players = players.map((player) => ({
    ...player,
    isRevealed: false,
  }));
  res.status(200).send({ message: "Reveal fechado para todos" });
});

// Caso queira atualizar atividade em outras ações, basta chamar updatePlayerActivity(id)

const PORT = process.env.PORT || 443;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
