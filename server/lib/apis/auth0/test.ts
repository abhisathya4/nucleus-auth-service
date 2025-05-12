// test-auth0-sdk.ts

import { auth0 } from ".";

async function testAuth0SDK() {
  try {
    console.log("Testing Auth0 Management SDK...");

    // Test authentication
    console.log("\n🔑 Testing authentication");
    const token = await auth0.getToken();
    console.log(
      "Authentication successful! Token:",
      token.access_token.substring(0, 10) + "..."
    );

    // Test users endpoint
    console.log("\n👤 Testing users endpoint");
    const users = await auth0.Users.getUsers({ per_page: 5 });
    console.log(`Users retrieved: ${Array.isArray(users) ? users.length : 0}`);
    if (Array.isArray(users) && users.length > 0) {
      console.log("Sample user:", {
        user_id: users[0]?.user_id,
        email: users[0]?.email,
        created_at: users[0]?.created_at,
      });
    }

    // Test roles endpoint
    console.log("\n🔐 Testing roles endpoint");
    const roles = await auth0.Roles.getRoles();
    console.log(`Roles retrieved: ${Array.isArray(roles) ? roles.length : 0}`);
    if (Array.isArray(roles) && roles.length > 0) {
      console.log("Sample role:", {
        id: roles[0]?.id,
        name: roles[0]?.name,
        description: roles[0]?.description,
      });
    }

    // Test organizations endpoint
    console.log("\n🏢 Testing organizations endpoint");
    const orgs = await auth0.Organizations.getOrganizations();
    console.log(`Organizations retrieved: ${orgs.length || 0}`);
    if (orgs && orgs.length > 0) {
      console.log("Sample organization:", {
        id: orgs[0]?.id,
        name: orgs[0]?.name,
        display_name: orgs[0]?.display_name,
      });

      // Test org members if any orgs exist
      console.log("\n👥 Testing organization members");
      const members = await auth0.Organizations.getMembers({
        id: orgs[0]!.id,
        per_page: 5,
      });
      console.log(
        `Organization members retrieved: ${
          Array.isArray(members) ? members.length : 0
        } (Total: ${members?.length || 0})`
      );
    }

    // Test connections endpoint
    console.log("\n🔌 Testing connections endpoint");
    const connections = await auth0.Connections.getConnections();
    console.log(
      `Connections retrieved: ${
        Array.isArray(connections) ? connections.length : 0
      }`
    );
    if (Array.isArray(connections) && connections.length > 0) {
      console.log("Sample connection:", {
        id: connections[0]?.id,
        name: connections[0]?.name,
        strategy: connections[0]?.strategy,
      });
    }

    // Test clients endpoint
    console.log("\n🖥️ Testing clients endpoint");
    const clients = await auth0.Clients.getClients();
    console.log(
      `Clients retrieved: ${Array.isArray(clients) ? clients.length : 0}`
    );
    if (Array.isArray(clients) && clients.length > 0) {
      console.log("Sample client:", {
        client_id: clients[0]?.client_id,
        name: clients[0]?.name,
        app_type: clients[0]?.app_type,
      });

      // Test get client by ID
      console.log("\n🔍 Testing get client by ID");
      try {
        const client = await auth0.Clients.getClient(clients[0]!.client_id);
        console.log("Client details retrieved successfully:", {
          client_id: client.client_id,
          name: client.name,
          description: client.description,
        });
      } catch (error: any) {
        console.error("Error retrieving client details:", error.message);
      }
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Error testing SDK:", error);
    // More detailed error information
    if (error.response) {
      console.error("Response error data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("Request was made but no response received");
    } else {
      console.error("Error message:", error.message);
    }
  }
}

// Run the tests
testAuth0SDK();
