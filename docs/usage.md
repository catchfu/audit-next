# Usage Examples (PowerShell)

```powershell
$base = "http://localhost:3000"

# Health
Invoke-RestMethod -Uri "$base/health" -Method Get | ConvertTo-Json -Depth 6

# Validate ESEF from inline content
$content = @"
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:ix="http://www.xbrl.org/2013/inlineXBRL" xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink">
  <head>
    <link:schemaRef xlink:href="https://www.esma.europa.eu/taxonomy/2024-03-20/esef_taxonomy.xsd" xlink:type="simple"/>
  </head>
  <body>
    <ix:nonFraction name="ifrs-full:Revenue" contextRef="c1" unitRef="u1">1000</ix:nonFraction>
    <xbrli:context id="c1"><xbrli:entity><xbrli:identifier scheme="http://www.example.com">ENTITY</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>2024-12-31</xbrli:instant></xbrli:period></xbrli:context>
    <xbrli:unit id="u1"><xbrli:measure>iso4217:EUR</xbrli:measure></xbrli:unit>
  </body>
</html>
"@
Invoke-RestMethod -Uri "$base/esef/validate" -Method Post -ContentType "application/json" -Body (@{content=$content} | ConvertTo-Json) | ConvertTo-Json -Depth 6

# LEI search and graph enrich
$leiRes = Invoke-RestMethod -Uri "$base/lei/search?q=Allianz" -Method Get
$leiId = $leiRes.data[0].id
Invoke-RestMethod -Uri "$base/entity/graph/enrich" -Method Post -ContentType "application/json" -Body (@{lei=$leiId} | ConvertTo-Json) | ConvertTo-Json -Depth 6

# Evidence chain
Invoke-RestMethod -Uri "$base/evidence" -Method Get | ConvertTo-Json -Depth 6
```