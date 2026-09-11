const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hola Mercado Viva');
});

app.listen(PORT, () => {
    console.log(`Servidor corre en http://localhost:${PORT}`);
});
