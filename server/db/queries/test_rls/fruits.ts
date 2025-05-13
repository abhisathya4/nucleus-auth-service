import { createSecureClient } from "../../rls/secure-drizzle";
import { fruits } from "../../schema/test_rls/fruits";

// Use `authDb` to query data for a specific organization
export const getFruitsForOrganization = async (token: string) => {
  // Create a scoped client with the token
  const authDb = await createSecureClient(token);

  // Use the scoped `authDb` for RLS-based queries
  const fruitsData = await authDb.query((db) => db.select().from(fruits));

  return fruitsData;
};
