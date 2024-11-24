const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();

// Middleware para interpretar JSON
app.use(express.json());

// CORS configuration with preflight support
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  preflightContinue: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Middleware para adicionar o cabeçalho Access-Control-Allow-Private-Network
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// Endpoint para filtrar rações
app.post('/filter-racoes', (req, res) => {
  console.log('Requisição recebida:', req.body);

  const { tipoPet, pesoPacote } = req.body;
  if (!tipoPet || !pesoPacote) {
    res.status(400).json({ error: 'Parâmetros inválidos: tipoPet e pesoPacote são obrigatórios.' });
    return;
  }

  const resultados = [];

  fs.createReadStream('./racoes.csv')
    .pipe(csv())
    .on('data', (row) => {
      console.log('Linha processada:', row);

      // Garantir que o peso do pacote seja comparado como número
      const pesoDoPacoteCSV = parseFloat(row.pesoPacote);

      if (
        row.tipo.toLowerCase() === tipoPet.toLowerCase() &&
        pesoDoPacoteCSV === pesoPacote
      ) {
        resultados.push(row);
      }
    })
    .on('end', () => {
      console.log('Resultados filtrados:', resultados);
      res.json(resultados);
    })
    .on('error', (err) => {
      console.error('Erro ao processar CSV:', err);
      res.status(500).json({ error: 'Erro ao processar o CSV.' });
    });
});

// Configuração dinâmica da porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
