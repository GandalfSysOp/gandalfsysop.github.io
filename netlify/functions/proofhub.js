export async function handler(event) {
  try {
    const path = event.queryStringParameters?.path;

    if (!path) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing path parameter" })
      };
    }

    // FINAL ProofHub URL
    const url = `https://projects.proofhub.com/api/v3/${path}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PROOFHUB_API_KEY,
        "x-comp-url": "projects.proofhub.com",
        "Ver": "lite",
        "Content-Type": "application/json"
      }
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
