// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ExtractionResponse {
  papers_processed: number;
  total_nodes: number;
  total_edges: number;
  nodes: { name: string; type: string }[];
  edges: { source: string; target: string; type: string }[];
}

export interface ChatRequest {
  message: string;
  nodes: { name: string; type: string }[];
  edges: { source: string; target: string; type: string }[];
}

export async function extractGraph(pdfPaths: string[]): Promise<ExtractionResponse> {
  const response = await fetch(`${API_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pdf_paths: pdfPaths }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to extract graph');
  }

  return response.json();
}

export async function chatWithGraph(data: ChatRequest): Promise<string> {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get chat response');
  }

  const result = await response.json();
  return result.response;
}