const API_URL = "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql";

export async function graphqlQuery(jwt, query) {
  if (!jwt) {
    throw new Error("No JWT provided");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    const errorMessage = result.errors?.[0]?.message || "GraphQL query failed";
    console.error("GraphQL Error:", result.errors);
    throw new Error(errorMessage);
  }

  return result;
}

export async function fetchUserData(jwt) {
  return graphqlQuery(
    jwt,
    `query GetUserData {
      user {
        id
        login
        email

        transactions {
          type
          amount
          path
          createdAt
        }

        progresses(where: { grade: { _is_null: false } }) {
          grade
          path
        }

        results {
          path
          grade
        }
      }
    }`
  );
}