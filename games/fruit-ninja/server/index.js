const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');

const PORT = 3000;
app.use(cors());
app.use(express.json());


app.post('/api/save-score', (req, res) => {
    const score = req.body.score;
    const name = req.body.name;
    fs.appendFile('scores.txt', `${name}: ${score}\n`, (err) => {
        if (err){
            console.error('Error writing to a file: ', err);
            res.status(500).json({ error: 'Error writing to file' });
        }else{
            res.json({ message: 'Score saved successfully' });
            
        }
    });
});
app.get('/api/get-scores', (_, res) =>{
    fs.readFile('scores.txt', 'utf-8', (err, data) =>{
        if (err){
            console.error('Error reading file', err)
            return res.status(500).json({ error: "Internal server error"});
        }

        const lines = data.split('\n');
        const scores =[];
        lines.forEach((line) => {
            const [name, score] = line.split(': ');
            if (name && score){
                scores.push({ name: name.trim(), score: parseInt(score.trim()) });
            }
        });
        scores.sort((a, b) => b.score - a.score);
        res.json(scores);
    });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);  
});