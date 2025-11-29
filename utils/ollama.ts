export async function callOllama(prompt: string): Promise<string> {
  try {
    const host =
      process.env.OLLAMA_HOST ||
      process.env.VITE_OLLAMA_HOST ||
      "http://localhost:11434";

    const model =
      process.env.OLLAMA_MODEL ||
      process.env.VITE_OLLAMA_MODEL ||
      "gpt-oss:20b";

    const url = `${host.replace(/\/$/, "")}/api/generate`;

    // Force non-streaming so we get ONE clean JSON object.
    const body = {
      model,
      prompt,
      stream: false
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama API error ${res.status}: ${txt}`);
    }

    const js = await res.json();

    // Ollama non-stream response shape:
    // { model: "...", created_at: "...", response: "FULL TEXT HERE", done: true }
    if (typeof js?.response === "string") {
      return js.response;
    }

    // Fallbacks (rare)
    if (js?.content) return js.content;
    if (js?.text) return js.text;

    return JSON.stringify(js);
  } catch (e: any) {
    console.error("Ollama client error:", e);
    return `Error: Ollama request failed: ${e?.message || e}`;
  }
}
