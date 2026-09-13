import { ChatRequest, ExtractionResponse, IngestionProgressEvent } from '@/types';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export async function extractGraphStream(
  pdfPaths: string[],
  onProgress: (event: IngestionProgressEvent) => void
): Promise<ExtractionResponse> {
  const response = await fetch(`${API_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pdf_paths: pdfPaths, stream: true }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to extract graph' }));
    throw new Error(error.detail || 'Failed to extract graph');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: ExtractionResponse | null = null;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const event: IngestionProgressEvent = JSON.parse(trimmed.slice(6));
            onProgress(event);
            if (event.type === 'complete' && event.result) {
              finalResult = event.result;
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Error occurred during extraction');
            }
          } catch (e) {
            if (e instanceof Error && !e.message.includes('JSON')) {
              throw e;
            }
          }
        }
      }
    }
  }

  if (buffer.trim().startsWith('data: ')) {
    try {
      const event: IngestionProgressEvent = JSON.parse(buffer.trim().slice(6));
      onProgress(event);
      if (event.type === 'complete' && event.result) {
        finalResult = event.result;
      } else if (event.type === 'error') {
        throw new Error(event.message || 'Error occurred during extraction');
      }
    } catch (e) {
      if (e instanceof Error && !e.message.includes('JSON')) {
        throw e;
      }
    }
  }

  if (!finalResult) {
    throw new Error('No graph data returned from streaming extraction.');
  }

  return finalResult;
}


export async function chatWithGraph(data: ChatRequest,onToken:(token:string) => void ): Promise<void> {
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

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if(reader) {
    while(true) {
      const {done,value} = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value,{stream:true});
      onToken(chunk)
    }
  }
}

export async function fetchGraph() {
  const res = await fetch(`${API_URL}/graph`);
  if(!res.ok) throw new Error("Failed to load saved graph")
    return res.json()
  
}

export async function resetKnowledgeBase(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_URL}/graph`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to reset knowledge base' }));
    throw new Error(error.detail || 'Failed to reset knowledge base');
  }
  return res.json();
}