const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const express = require('express');
const app = express();


dotenv.config(); 


console.log(process.env); 

const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.db.user}:${process.env.db.password}@${process.env.db.host}/${process.env.db.name}?retryWrites=true&w=majority`;

let db;

async function connectDB() {
    try {
        const client = new MongoClient(uri, { useUnifiedTopology: true });
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db();
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
}

app.get('/lessons', async (req, res) => {
    try {
        const lessons = await db.collection('lessons').find().toArray();
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch lessons', error });
    }
});

connectDB();

app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});
