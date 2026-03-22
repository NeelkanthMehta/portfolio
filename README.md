# Neelkanth Mehta — Personal Portfolio Website

A professional single-page portfolio site built with plain HTML, CSS, and JavaScript. Deployed on Vercel with zero monthly cost. Features an AI-powered professional concierge chatbot and Calendly booking integration.

🌐 **Live site:** [neelkanthmehta.vercel.app](https://neelkanthmehta.vercel.app)

---

## Features

- **Single-page layout** with two tabs — Profile and Projects
- **Collapsible sections** — About, Skills, Experience, and Résumé
- **Resume download** — one-click PDF download
- **AI Concierge Chatbot** — powered by Groq API (Llama 3.3 70B), acts as a professional concierge answering questions about background, skills, and availability
- **Calendly Integration** — visitors can book a call directly from the chat window
- **Responsive design** — optimised for desktop, tablet, and large phones
- **Zero-maintenance stack** — no frameworks, no build steps, no dependencies to update

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | HTML · CSS · Vanilla JavaScript |
| AI Chatbot | Groq API · Llama 3.3 70B (open source) |
| Serverless Function | Vercel Edge Function (`api/chat.js`) |
| Scheduling | Calendly popup widget |
| Hosting | Vercel (free tier) |
| Version Control | GitHub |

---

## Project Structure

```
portfolio/
│
├── index.html        ← entire site — profile, projects, chatbot UI
├── resume.pdf        ← downloadable résumé
├── README.md         ← this file
│
└── api/
    └── chat.js       ← Vercel serverless function (Groq API proxy)
```

---

## How the Chatbot Works

The chatbot is powered by **Llama 3.3 70B via the Groq API** — a free, open-source large language model with near-instant response speeds. A detailed system prompt instructs the model to act as Neelkanth's professional concierge, with full knowledge of his background, experience, projects, and availability.

```
Visitor sends a message
        ↓
index.html sends it to /api/chat
        ↓
Vercel Edge Function calls Groq API
(API key stays hidden server-side)
        ↓
Llama 3.3 responds in concierge persona
        ↓
Response streams back to the chat UI
```

The API key is stored securely as a Vercel Environment Variable and is never exposed to the browser.

---

## Calendly Integration

A **Book a Call** button sits permanently in the chat header. The chatbot also auto-detects scheduling intent — if a visitor types keywords like "schedule", "book", "meeting", or "call", it opens the Calendly popup automatically.

---

## Environment Variables

To run this project, add the following environment variable in your Vercel project settings:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |

---

## Deployment

This site deploys automatically via Vercel. Any file pushed to this GitHub repository triggers a redeployment within 30 seconds — no manual steps required.

---

## Cost

| Item | Cost |
|---|---|
| Hosting (Vercel) | Free |
| AI API (Groq) | Free (14,400 requests/day) |
| Scheduling (Calendly) | Free |
| Domain | ~$12/year (optional) |
| **Total** | **~$0/month** |

---

*Built and maintained by Neelkanth Mehta · Mumbai, India*  
*© 2026 Neelkanth Mehta · All rights reserved*
