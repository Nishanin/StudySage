require("dotenv").config();
const client = require("./qdrant");

async function main() {
  console.log("Connecting to Qdrant...");
  const collectionName = "study_chunks";
  try {
    console.log("Creating collection...");
    await client.createCollection(collectionName, {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });
  } catch (err) {
    if (err && err.response && err.response.status === 409) {
      console.log("collection exists");
    } else if (err && err.body && err.body.status === "collection_exists") {
      console.log("collection exists");
    } else {
      console.error("Error creating collection:", err.message || err);
      process.exit(1);
    }
  }

  try {
    await client.createPayloadIndex(collectionName, {
      field_name: "workspace_id",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(collectionName, {
      field_name: "resource_id",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(collectionName, {
      field_name: "content_type",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(collectionName, {
      field_name: "page_number",
      field_schema: "integer",
    });
    await client.createPayloadIndex(collectionName, {
      field_name: "slide_number",
      field_schema: "integer",
    });
    await client.createPayloadIndex(collectionName, {
      field_name: "timestamp",
      field_schema: "integer",
    });
    console.log("Indexes created");
  } catch (err) {
    console.error("Error creating indexes:", err.message || err);
    process.exit(1);
  }

  console.log("Ready");
}

main();
