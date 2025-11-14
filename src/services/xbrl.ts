export function detectXbrl(content: string) {
  const hasXbrl = /<\s*xbrli:xbrl[\s>]/i.test(content) || /<\s*xbrl[\s>]/i.test(content);
  const hasIxbrl = /<\s*ix:nonFraction[\s>]/i.test(content) || /<\s*ix:nonNumeric[\s>]/i.test(content);
  const factsApprox = (content.match(/<[^>]+:[A-Za-z0-9_]+\s[^>]*contextRef=/g) || []).length;
  return { hasXbrl, hasIxbrl, factsApprox };
}

function extractSchemaRefs(content: string) {
  const refs: string[] = [];
  const rx = /<\s*(?:link:)?schemaRef[^>]*xlink:href\s*=\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(content)) !== null) refs.push(m[1]);
  return refs;
}

function inferEsefVersion(uri: string) {
  const m = uri.match(/(20\d{2}-\d{2}-\d{2})/);
  if (m) return m[1];
  return undefined;
}

export function validateXbrl(content: string) {
  const meta = detectXbrl(content);
  const schemaRefs = extractSchemaRefs(content);
  const usesEsef = schemaRefs.some((u) => /esma\.|esef_taxonomy|esma\.europa\.eu\/taxonomy/i.test(u));
  const versions = schemaRefs.map(inferEsefVersion).filter(Boolean) as string[];
  const contexts = (content.match(/<\s*xbrli:context[\s>]/gi) || []).length;
  const units = (content.match(/<\s*xbrli:unit[\s>]/gi) || []).length;
  const issues: string[] = [];
  if (!schemaRefs.length) issues.push("missing_schemaRef");
  if (meta.hasXbrl && !usesEsef) issues.push("no_esef_taxonomy");
  if (contexts === 0) issues.push("no_contexts");
  if (units === 0) issues.push("no_units");
  return {
    hasXbrl: meta.hasXbrl,
    hasIxbrl: meta.hasIxbrl,
    factsApprox: meta.factsApprox,
    schemaRefs,
    usesEsef,
    taxonomyVersions: Array.from(new Set(versions)),
    contexts,
    units,
    issues,
  };
}