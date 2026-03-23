export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── SEARCH SUPABASE ──────────────────────────────────────────────
async function searchCirculars(query, regulator) {
  // Build keyword search — match against title, content, summary, category
  const keywords = query.toLowerCase().split(" ")
    .filter(w => w.length > 3)
    .slice(0, 5);

  // Fetch circulars filtered by regulator
  let url = `${SUPABASE_URL}/rest/v1/circulars?select=title,circular_no,date_issued,category,regulator,url,content,summary&order=date_issued.desc&limit=50`;

  if (regulator !== "both") {
    url += `&regulator=eq.${regulator.toUpperCase()}`;
  }

  const response = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const circulars = await response.json();

  // Score each circular by keyword relevance
  const scored = circulars.map(c => {
    const text = `${c.title} ${c.content || ""} ${c.summary || ""} ${c.category || ""}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (c.title.toLowerCase().includes(kw)) score += 3; // title match = higher weight
      if ((c.category || "").toLowerCase().includes(kw)) score += 2;
      if (text.includes(kw)) score += 1;
    }
    return { ...c, score };
  });

  // Return top 5 most relevant
  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ── BUILD CONTEXT ────────────────────────────────────────────────
function buildContext(circulars) {
  if (!circulars.length) return "";
  return circulars.map((c, i) => {
    const ref     = c.circular_no || "N/A";
    const date    = c.date_issued || "N/A";
    const summary = c.summary || "";
    const content = c.content ? c.content.slice(0, 800) : "";
    const body    = summary || content || "No content available.";
    return `[${i + 1}] ${c.regulator} | ${c.title}
Ref: ${ref} | Date: ${date} | Category: ${c.category || "General"}
${body}
Source: ${c.url || "N/A"}`;
  }).join("\n\n---\n\n");
}

// ── MAIN HANDLER ─────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { question, regulator = "both" } = await req.json();

    if (!question || question.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid question." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Search database
    const circulars = await searchCirculars(question, regulator);

    // Build system prompt
    const context = buildContext(circulars);
    const hasContext = circulars.length > 0;

    const systemPrompt = `You are a regulatory intelligence assistant specialising in Indian financial regulation — SEBI and RBI circulars and guidelines.

${hasContext ? `You have been provided with ${circulars.length} relevant circular(s) from a regulatory database. Use these as your primary source to answer the question. Always cite the circular reference number and date when referencing a specific circular.` : "No directly matching circulars were found in the database for this query."}

Guidelines:
- Be concise, accurate, and professional
- Always cite circular references when available (e.g. "As per RBI/2025-26/250...")
- If the database context does not fully answer the question, say so clearly and suggest the user check SEBI or RBI directly
- Do not speculate or invent regulatory details
- Structure your answer clearly — lead with the direct answer, then supporting detail

${hasContext ? `RELEVANT CIRCULARS FROM DATABASE:\n\n${context}` : ""}`;

    // Stream response from Groq
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: question }
          ],
          max_tokens: 600,
          temperature: 0.2,
          stream: true
        })
      }
    );

    // Return citation metadata alongside the stream
    const citations = circulars.map(c => ({
      title:      c.title,
      ref:        c.circular_no || "",
      date:       c.date_issued || "",
      regulator:  c.regulator,
      category:   c.category || "",
      url:        c.url || ""
    }));

    // Inject citations as first chunk, then stream the answer
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Send citations as first SSE event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ citations })}\n\n`)
        );

        // Stream Groq response
        const reader = groqResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
