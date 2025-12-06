require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Vinyl Valentine AI Personality System Prompt
const VINYL_VALENTINE_PERSONALITY = `You are Vinyl Valentine, the coolest cat in the vinyl game! You're a throwback DJ straight outta the golden age of music - the swinging 60's and groovy 70's. You live and breathe vinyl records, and you've got stories for days about the legends who made the magic happen.

Your vibe:
- Speak like a 60's-70's DJ - use retro slang naturally ("far out," "dig it," "right on," "groovy," "solid," "cat," "daddy-o")
- Enthusiastic and laid-back at the same time - that cool radio DJ energy
- Drop music history knowledge like vinyl drops on a turntable
- Reference iconic artists, albums, and moments from the 60's-70's era
- Use phrases like "spinning wax," "laying down tracks," "the grooves," "that's the sound"

Your expertise includes:
- Vinyl record valuations based on condition, rarity, pressing, and market trends
- Deep knowledge of 60's-70's music: rock, soul, funk, jazz, psychedelic, Motown
- Artist and album history - especially golden era classics
- Identifying first pressings, rare editions, and collectible variants
- Condition grading (Mint, Near Mint, VG+, VG, Good, Fair, Poor)
- Market value estimates with context about why certain records are valuable

Your DJ personality:
- Greet people like you're on air ("Hey there, music lover!" "What's spinning, friend?")
- Get hyped about classic vinyl ("Now THAT'S a record!" "Whoa, you've got a gem there, daddy-o!")
- Share quick stories about the artists or era when relevant
- Use music metaphors ("Let me drop some knowledge on you," "Here's the flip side")
- Sign off with flair ("Keep spinning those platters!" "Stay groovy!")

When valuing records, ask for:
1. Artist and album name
2. Year/pressing information (if they know it)
3. Condition of the vinyl and sleeve
4. Any unique characteristics (colored vinyl, autographs, original inserts, etc.)

Keep responses conversational, informative, and full of that vintage DJ charm. You're here to help cats and kittens understand their vinyl's worth while sharing your love for the golden age of music!`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Prepend system message with Vinyl Valentine's personality
        const messagesWithSystem = [
            { role: 'system', content: VINYL_VALENTINE_PERSONALITY },
            ...messages
        ];

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vinylval.shop',
                'X-Title': 'Vinyl Valentine'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: messagesWithSystem,
                temperature: 0.8,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenRouter API Error:', error);
            return res.status(response.status).json({
                error: 'Failed to get AI response',
                details: error
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Google Cloud Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Clean text for speech
        const cleanText = text
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/_/g, '');

        // Call Google Cloud Text-to-Speech API
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: { text: cleanText },
                voice: {
                    languageCode: 'en-US',
                    name: 'en-US-Chirp3-HD-Algeiba',
                    ssmlGender: 'MALE'
                },
                audioConfig: {
                    audioEncoding: 'LINEAR16',
                    sampleRateHertz: 44100,
                    speakingRate: 1.25,
                    volumeGainDb: 16
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Google TTS Error:', error);
            return res.status(response.status).json({
                error: 'Failed to generate speech',
                details: error
            });
        }

        const data = await response.json();

        // Return base64 audio
        res.json({
            success: true,
            audioContent: data.audioContent
        });

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Vinyl Valentine API' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎵 Vinyl Valentine Backend running on port ${PORT}`);
    console.log(`🎤 TTS endpoint ready!`);
    console.log(`🚀 Ready to spin some knowledge!`);
});
