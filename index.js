const express = require("express");
const http = require("http");
const cors = require("cors"); // Importa o pacote CORS
const { Server } = require("socket.io");

// Configurando o servidor express
const app = express();

// Configuração de CORS para Express
app.use(
  cors({
    origin: "*", // Substitua pela URL do seu front-end
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  })
);

const server = http.createServer(app);

// Configurando o Socket.io com CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  pingInterval: 25000, // Intervalo de ping a cada 25 segundos
  pingTimeout: 50000, // Desconecta se não receber pong em 50 segundos
  transports: ["websocket", "polling"], // Ativa WebSocket e polling como fallback
});

let players = [];
let isRevealed = false; // Estado global que controla se as cartas estão reveladas

// Função para log detalhado de conexões e desconexões
io.use((socket, next) => {
  console.log("Nova conexão:", socket.id); // Log de novas conexões
  next();
});

io.on("connection", (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  // Envia a lista completa de jogadores ao novo cliente
  socket.emit("currentPlayers", players);

  // Recebe a informação quando um jogador entra
  socket.on("joinGame", (player) => {
    player.socketId = socket.id; // Salva o socketId do jogador
    players.push(player);
    io.emit("playerJoined", player);
  });

  // Recebe a seleção de uma carta por um jogador
  socket.on("selectCard", (updatedPlayer) => {
    players = players.map((player) =>
      player.id === updatedPlayer.id ? updatedPlayer : player
    );
    io.emit("cardSelected", updatedPlayer);
  });

  // Recebe o comando para revelar as cartas
  socket.on("revealCards", () => {
    isRevealed = true; // Altera o estado global de revelação
    io.emit("revealCards", true); // Notifica todos os clientes para revelar as cartas
  });

  // Evento de reset dos jogadores (resetPlayers)
  socket.on("resetPlayers", (resetPlayers) => {
    players = resetPlayers; // Atualiza a lista de jogadores no servidor
    io.emit("currentPlayers", players); // Envia a lista atualizada para todos os clientes
  });

  // Lida com a desconexão do jogador e o remove da lista
  socket.on("disconnect", () => {
    console.log(`Usuário desconectado: ${socket.id}`);
    players = players.filter((player) => player.socketId !== socket.id); // Remove o jogador da lista
    io.emit("playerDisconnected", socket.id); // Notifica todos os clientes sobre a desconexão
  });

  // Evento de novo jogo - reinicia o jogo para todos os jogadores
  socket.on("newGame", () => {
    players = []; // Reseta os jogadores no servidor
    isRevealed = false; // Reseta o estado de revelação
    io.emit("newGame"); // Notifica todos os clientes para reiniciar o jogo
  });
});

// Servidor ouvindo na porta 443
const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Rota padrão GET
app.get("/", (req, res) => {
  res.send("Bem-vindo ao servidor com Socket.io!");
});
