export function resolveEntity(input, sources) {
    const ids = {};
    if (input.lei)
        ids.lei = input.lei;
    if (input.cik)
        ids.cik = input.cik;
    if (input.companyNumber)
        ids.companyNumber = input.companyNumber;
    const name = sources["gleif"] && sources["gleif"]?.data?.[0]?.attributes?.entity?.legalName?.name;
    return { name: name || input.name, ids, sources };
}
