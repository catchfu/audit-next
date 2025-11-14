export function detectXbrl(content) {
    const hasXbrl = /<\s*xbrli:xbrl[\s>]/i.test(content) || /<\s*xbrl[\s>]/i.test(content);
    const hasIxbrl = /<\s*ix:nonFraction[\s>]/i.test(content) || /<\s*ix:nonNumeric[\s>]/i.test(content);
    const factsApprox = (content.match(/<[^>]+:[A-Za-z0-9_]+\s[^>]*contextRef=/g) || []).length;
    return { hasXbrl, hasIxbrl, factsApprox };
}
