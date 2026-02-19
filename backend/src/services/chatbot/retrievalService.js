const client = require("../../vector/qdrant");

async function searchChunks({ embedding, resource_id, context }) {
  const collectionName = "study_chunks";
  const limit = 6;
  if (!embedding || !resource_id)
    throw new Error("embedding and resource_id required");

  const baseFilter = {
    must: [{ key: "resource_id", match: { value: resource_id } }],
  };

  // Context filter
  const contextualFilter = { ...baseFilter, must: [...baseFilter.must] };

  // Add context filter if provided
  if (context?.type === "pdf" && typeof context.page === "number") {
    contextualFilter.must.push({
      key: "page_number",
      range: { gte: Math.max(0, context.page - 1), lte: context.page + 1 },
    });
  }

  if (context?.type === "ppt" && typeof context.slide === "number") {
    contextualFilter.must.push({
      key: "slide_number",
      match: { value: context.slide },
    });
  }

  if (context?.type === "video" && typeof context.timestamp === "number") {
    contextualFilter.must.push({
      key: "timestamp",
      range: {
        gte: Math.max(0, context.timestamp - 120),
        lte: context.timestamp + 120,
      },
    });
  }

  async function runSearch(filterObj) {
    const res = await client.search(collectionName, {
      query_vector: embedding,
      filter: filterObj,
      limit,
      with_payload: true,
    });

    return (res || []).map((r) => ({
      text: r.payload.text || "",
      page_number: r.payload.page_number ?? null,
      slide_number: r.payload.slide_number ?? null,
      timestamp: r.payload.timestamp ?? null,
      score: r.score,
    }));
  }

  let results = await runSearch(contextualFilter);

  if (!results.length && contextualFilter.must.length > 1) {
    results = await runSearch(baseFilter);
  }

  return results;
}

module.exports = { searchChunks };
