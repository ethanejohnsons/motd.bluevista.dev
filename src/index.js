require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPEN_AI_KEY }));

app.use(express.static('public'));

const fileName = 'history.json';
let date = '';
let motd = '';

const server = app.listen(4000, async () => {
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, "[]");
    }
    await getMotd();
});

// Send the MOTD
app.get('/motd', (req, res) => {
    res.end(JSON.stringify({ date, motd }));
});

const nth = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

const getMotd = async () => {
    // Set up next call to this function
    const now = new Date();
    let millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0) - now;
    if (millis < 0) {
        millis += 86400000;
    }
    setTimeout(getMotd, millis);

    // Request new MOTD from OpenAI
    const day = now.getDate();
    const weekDay = now.toLocaleDateString('default', { weekday: 'long' });
    const month = now.toLocaleString('default', { month: 'long' });
    const dateString = `${weekDay}, ${month} ${day}${nth(day)}`;

    const messages = [
        { role: "system", content: `You are a poet.` },
        { role: "user", content: `Today's date is ${dateString}. 
                Please write a short poem using this information and limit your response to 4 lines. 
                Additionally, try not to use the full date in the poem. Please use common meter.`
        }
    ];

    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages
    });

    date = dateString;
    motd = response.data.choices[0].message.content.trim();

    // Save the message in history.json
    let history = JSON.parse(fs.readFileSync(fileName));
    history.push({date: dateString, motd});
    fs.writeFileSync(fileName, JSON.stringify(history));
}