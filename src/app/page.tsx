"use client";
import React, { useState } from "react";

export default function OrchestratorChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse("Error al comunicarse con el orchestrator.");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "2rem auto" }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe tu mensaje..."
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />
      <button type="submit" disabled={loading || !input}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
      {response && (
        <div style={{ marginTop: 16, background: "#f5f5f5", padding: 12 }}>
          <strong>Respuesta:</strong> {response}
        </div>
      )}
    </form>
  );
}
