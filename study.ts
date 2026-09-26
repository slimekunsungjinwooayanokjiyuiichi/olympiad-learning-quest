const json = (res: any, status: number, body: unknown) => res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(body));
const clean = (value: string) => value.replace(/[<>]/g, '').trim().slice(0, 160);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const query = clean(String(req.query?.q || ''));
  const source = String(req.query?.source || 'all');
  if (!query) return json(res, 400, { error: 'Search query is required' });
  const results: any[] = [];

  const tasks: Promise<void>[] = [];
  if (source === 'all' || source === 'wikipedia') tasks.push(
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      .then(r => r.ok ? r.json() : null).then(data => { if (data?.extract) results.push({ source: 'Wikipedia', title: data.title, summary: data.extract, url: data.content_urls?.desktop?.page }); }).catch(() => {}),
  );
  if (source === 'all' || source === 'openalex') tasks.push(
    fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=3`)
      .then(r => r.ok ? r.json() : null).then(data => data?.results?.forEach((item: any) => results.push({ source: 'OpenAlex', title: item.title, summary: `${item.publication_year || ''} · ${item.cited_by_count || 0} citations`, url: item.doi || item.id }))).catch(() => {}),
  );
  if (source === 'all' || source === 'openlibrary') tasks.push(
    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3`)
      .then(r => r.ok ? r.json() : null).then(data => data?.docs?.forEach((item: any) => results.push({ source: 'Open Library', title: item.title, summary: `${item.author_name?.[0] || 'Unknown author'}${item.first_publish_year ? ` · ${item.first_publish_year}` : ''}`, url: `https://openlibrary.org${item.key}` }))).catch(() => {}),
  );
  await Promise.all(tasks);
  return json(res, 200, { query, results });
}
