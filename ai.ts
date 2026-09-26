import { getVercelOidcToken } from '@vercel/oidc';

type GatewayModel = { id: string; name?: string; type?: string };

const json = (res: any, status: number, body: unknown) => {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(body));
};

const preferredGeminiModels = [
  'google/gemini-3.5-flash-lite',
  'google/gemini-3.5-flash',
  'google/gemini-3.6-flash',
  'google/gemini-3.7-flash',
  'google/gemini-3.8-flash',
];

const gatewayToken = async () => {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    return (await getVercelOidcToken()) || process.env.VERCEL_OIDC_TOKEN;
  } catch {
    return process.env.VERCEL_OIDC_TOKEN;
  }
};

const gatewayRequest = async (path: string, init: RequestInit = {}, token?: string) => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`https://ai-gateway.vercel.sh/v1${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body?.error?.message || body?.error || `AI Gateway error ${response.status}`), { status: response.status });
  return body;
};

const sortedGeminiModels = (models: GatewayModel[]) => {
  const eligible = models.filter(model => model.id.startsWith('google/gemini-') && (!model.type || model.type === 'language'));
  const ids = new Set(eligible.map(model => model.id));
  return [
    ...preferredGeminiModels.filter(id => ids.has(id)),
    ...eligible.map(model => model.id).filter(id => !preferredGeminiModels.includes(id as typeof preferredGeminiModels[number])).sort(),
  ];
};

const orderedCandidates = (models: GatewayModel[], requested?: string) => {
  const available = new Set(models.map(model => model.id));
  const selected = requested ? (requested.startsWith('google/') ? requested : `google/${requested}`) : preferredGeminiModels[0];
  const gemini = sortedGeminiModels(models);
  const others = models
    .filter(model => /^(alibaba|qwen|openai|groq)\//i.test(model.id) && (!model.type || model.type === 'language'))
    .map(model => model.id);
  return [selected, ...gemini, ...others].filter((id, index, all) => available.has(id) && all.indexOf(id) === index);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    // The public model catalog lets the UI populate choices without exposing credentials.
    const catalog = await gatewayRequest('/models');
    const models: GatewayModel[] = Array.isArray(catalog?.data) ? catalog.data : [];
    const token = await gatewayToken();

    if (req.method === 'GET') {
      const gemini = sortedGeminiModels(models).map(id => {
        const model = models.find(item => item.id === id);
        return { id, name: model?.name || id.replace('google/', '') };
      });
      return json(res, 200, { gatewayConfigured: Boolean(token), authMode: process.env.AI_GATEWAY_API_KEY ? 'api-key' : token ? 'vercel-oidc' : 'unavailable', models: gemini });
    }

    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) return json(res, 400, { error: 'A prompt is required' });
    if (prompt.length > 50000) return json(res, 413, { error: 'Prompt is too large' });
    if (!token) return json(res, 503, { error: 'Vercel AI Gateway authentication is unavailable. Enable Vercel OIDC for this project or configure AI_GATEWAY_API_KEY.' });

    const ordered = orderedCandidates(models, typeof req.body?.model === 'string' ? req.body.model : undefined);
    if (!ordered.length) return json(res, 503, { error: 'No supported AI Gateway models are available' });

    const attempts: Array<{ model: string; message: string; status?: number }> = [];
    for (const model of ordered) {
      try {
        const data = await gatewayRequest('/chat/completions', {
          method: 'POST',
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 }),
        }, token);
        const content = data?.choices?.[0]?.message?.content;
        const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map((part: any) => part?.text || '').join('') : '';
        if (!text) throw new Error('Model returned no text');
        return json(res, 200, { text, provider: model.split('/')[0], model, attempts });
      } catch (error: any) {
        attempts.push({ model, message: error?.message || 'Unavailable', status: error?.status });
      }
    }
    return json(res, 503, { error: 'All available AI models are currently unavailable', attempts });
  } catch (error: any) {
    return json(res, error?.status || 503, { error: error?.message || 'AI Gateway unavailable' });
  }
}
