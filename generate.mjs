function prepare(query) {
  return encodeURIComponent(query.replace(/\n/g, " ").replace(/\s{2,}/g, " "));
}

async function doQuery(query) {
  const resp = await fetch(
    `https://query.wikidata.org/sparql?query=${prepare(query)}`,
    {
      headers: {
        Accept: "application/json",
        "cache-control": "no-cache",
        "User-Agent": "GT-Daily-Art/1.0",
      },
    }
  );

  return await resp.json();
}

export async function generate() {
  let painting = null;
  do {
    painting = await doQuery(`SELECT ?painting WHERE {
      ?painting wdt:P18 ?image; wdt:P170 ?creator
      SERVICE bd:sample {
        ?painting wdt:P31 wd:Q3305213 .
        bd:serviceParam bd:sample.limit 200 .
        bd:serviceParam bd:sample.sampleType "RANDOM" .
      }
      { ?sitelink schema:isPartOf <https://en.wikipedia.org/> . ?sitelink schema:about ?painting }
    }
    LIMIT 1`);
  } while (painting.results.bindings.length === 0);

  const id = painting.results.bindings[0].painting.value.match(/Q\d+$/)[0];

  return await doQuery(`SELECT ?paintingLabel ?creatorLabel ?created ?image ?locationLabel ?movementLabel ?subjectLabel ?materialLabel ?paintingLink ?creatorLink ?subjectLink ?movementLink ?locationLink
  WHERE {
    BIND(wd:${id} AS ?painting).
    ?painting wdt:P18 ?image .
    ?painting wdt:P170 ?creator .
    OPTIONAL { ?painting wdt:P571 ?created }
    OPTIONAL { ?painting wdt:P186 ?material }
    OPTIONAL {
      ?painting wdt:P921 ?subject .
      OPTIONAL { ?subjectLink schema:isPartOf <https://en.wikipedia.org/> . ?subjectLink schema:about ?subject }
    }
    OPTIONAL {
      ?painting wdt:P135 ?movement
      OPTIONAL { ?movementLink schema:isPartOf <https://en.wikipedia.org/> . ?movementLink schema:about ?movement }
    }
    OPTIONAL {
      ?painting wdt:P276 ?location
      OPTIONAL { ?locationLink schema:isPartOf <https://en.wikipedia.org/> . ?locationLink schema:about ?location }
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }

    { ?paintingLink schema:isPartOf <https://en.wikipedia.org/> . ?paintingLink schema:about ?painting }
    OPTIONAL { ?creatorLink schema:isPartOf <https://en.wikipedia.org/> . ?creatorLink schema:about ?creator }
  }`);
}
