import { getLeiRecord } from "../connectors/gleif.js";

type EntityInput = {
  name?: string;
  lei?: string;
  cik?: string;
  companyNumber?: string;
};

type ResolvedEntity = {
  name?: string;
  ids: Record<string, string>;
  sources: Record<string, unknown>;
};

export function resolveEntity(input: EntityInput, sources: Record<string, unknown>): ResolvedEntity {
  const ids: Record<string, string> = {};
  if (input.lei) ids.lei = input.lei;
  if (input.cik) ids.cik = input.cik;
  if (input.companyNumber) ids.companyNumber = input.companyNumber;
  const name = sources["gleif"] && (sources["gleif"] as any)?.data?.[0]?.attributes?.entity?.legalName?.name;
  return { name: name || input.name, ids, sources };
}

type GraphNode = { id: string; type: string; label?: string };
type GraphEdge = { from: string; to: string; type: string };
type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; ids: Record<string, string>; sources: Record<string, unknown>; name?: string };

export async function enrichEntityGraph(input: EntityInput): Promise<Graph> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const ids: Record<string, string> = {};
  const sources: Record<string, unknown> = {};
  let name = input.name;

  nodes.push({ id: "subject", type: "entity", label: name });

  if (input.lei) {
    ids.lei = input.lei;
    nodes.push({ id: `lei:${input.lei}`, type: "lei", label: input.lei });
    edges.push({ from: "subject", to: `lei:${input.lei}`, type: "identifier" });
    try {
      const record = await getLeiRecord(input.lei);
      sources.gleif = record;
      const n = record?.data?.[0]?.attributes?.entity?.legalName?.name;
      if (n) {
        name = name || n;
        nodes[0].label = name;
      }
      const rel = record?.data?.[0]?.relationships || {};
      for (const key of Object.keys(rel)) {
        const data = (rel as any)[key]?.data;
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item?.id) {
              const targetId = `lei:${item.id}`;
              if (!nodes.find((x) => x.id === targetId)) nodes.push({ id: targetId, type: "lei", label: item.id });
              edges.push({ from: `lei:${input.lei}`, to: targetId, type: key });
            }
          }
        } else if (data && typeof data === "object" && data.id) {
          const targetId = `lei:${data.id}`;
          if (!nodes.find((x) => x.id === targetId)) nodes.push({ id: targetId, type: "lei", label: data.id });
          edges.push({ from: `lei:${input.lei}`, to: targetId, type: key });
        }
      }
    } catch {}
  }

  if (input.cik) {
    ids.cik = input.cik;
    nodes.push({ id: `cik:${input.cik}`, type: "cik", label: input.cik });
    edges.push({ from: "subject", to: `cik:${input.cik}`, type: "identifier" });
  }

  if (input.companyNumber) {
    ids.companyNumber = input.companyNumber;
    nodes.push({ id: `ch:${input.companyNumber}`, type: "company_number", label: input.companyNumber });
    edges.push({ from: "subject", to: `ch:${input.companyNumber}`, type: "identifier" });
  }

  return { nodes, edges, ids, sources, name };
}