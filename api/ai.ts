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

const googleFallback = async (prompt: string, requested?: string) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const selected = requested?.replace(/^google\//, '');
  const choices = [
    ...(selected && /^gemini-[\w.-]+$/.test(selected) && !/(image|audio|tts|live)/i.test(selected) ? [selected] : []),
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ];
  let lastError: any;
  for (const model of [...new Set(choices)]) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions?api_version=v1beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ model, input: prompt }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      lastError = Object.assign(new Error(data?.error?.message || `Gemini API error ${response.status}`), { status: response.status });
      if ([401, 402, 403, 429].includes(response.status)) break;
      continue;
    }
    const text = data?.steps?.filter((step: any) => step.type === 'model_output')
      .flatMap((step: any) => step.content || []).filter((part: any) => part.type === 'text')
      .map((part: any) => part.text || '').join('\n') || '';
    if (text) return { text, provider: 'google-direct', model };
    lastError = new Error('Gemini returned no text');
  }
  throw lastError || new Error('Gemini models unavailable');
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
  const eligible = models.filter(model => model.id.startsWith('google/gemini-') && !/(image|audio|tts|live)/i.test(model.id) && (!model.type || model.type === 'language'));
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
  return [selected, ...gemini, ...others].filter((id, index, all) => available.has(id) && all.indexOf(id) === index).slice(0, 8);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const token = await gatewayToken();
    let models: GatewayModel[] = [];
    let catalogError: Error | null = null;
    if (token) {
      try {
        const catalog = await gatewayRequest('/models', {}, token);
        models = Array.isArray(catalog?.data) ? catalog.data : [];
      } catch (error: any) { catalogError = error; }
    }

    if (req.method === 'GET') {
      const gemini = sortedGeminiModels(models).map(id => {
        const model = models.find(item => item.id === id);
        return { id, name: model?.name || id.replace('google/', '') };
      });
      if (!models.length && !process.env.GEMINI_API_KEY) return json(res, 503, { error: catalogError?.message || 'No AI credentials are configured' });
      return json(res, 200, { gatewayConfigured: models.length > 0 || Boolean(process.env.GEMINI_API_KEY), serverGeminiConfigured: Boolean(process.env.GEMINI_API_KEY), authMode: models.length ? (process.env.AI_GATEWAY_API_KEY ? 'api-key' : 'vercel-oidc') : 'gemini-server', models: gemini });
    }

    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) return json(res, 400, { error: 'A prompt is required' });
    if (prompt.length > 50000) return json(res, 413, { error: 'Prompt is too large' });
    const ordered = orderedCandidates(models, typeof req.body?.model === 'string' ? req.body.model : undefined);
    if (!ordered.length && !process.env.GEMINI_API_KEY) return json(res, 503, { error: catalogError?.message || 'No supported AI models are available' });

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
        // Authentication and billing failures apply to every model; retrying cannot help.
        if ([401, 402, 403].includes(error?.status)) break;
      }
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const direct = await googleFallback(prompt, typeof req.body?.model === 'string' ? req.body.model : undefined);
        if (direct) return json(res, 200, { ...direct, attempts });
      } catch (error: any) {
        attempts.push({ model: 'gemini-3.5-flash-lite', message: error?.message || 'Gemini unavailable', status: error?.status });
      }
    }
    const first = attempts[attempts.length - 1];
    return json(res, first?.status || 503, { error: first ? `AI request failed: ${first.message}` : 'No AI model is available', attempts });
  } catch (error: any) {
    return json(res, error?.status || 503, { error: error?.message || 'AI Gateway unavailable' });
  }
}
