import axios, { AxiosError } from "axios";
import { SaveAPIAuth, GetAPIAuth } from "../../../redis/queries/apiAuth";
import type { Auth0Management } from "./Auth0Management";
import env from "../../config/env";
import { handleError } from "../../utils/axiosUtils";

const AUTH0_MANAGEMENT_DOMAIN = env.AUTH0_MANAGEMENT_DOMAIN!;
const AUTH0_MANAGEMENT_CLIENT_ID = env.AUTH0_MANAGEMENT_CLIENT_ID!;
const AUTH0_MANAGEMENT_CLIENT_SECRET = env.AUTH0_MANAGEMENT_CLIENT_SECRET!;
const AUTH0_MANAGEMENT_AUDIENCE = `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/`;

export const auth0: Auth0Management.API = {
  async getToken(): Promise<Auth0Management.TokenResponse> {
    try {
      const response = await fetch(
        `https://${AUTH0_MANAGEMENT_DOMAIN}/oauth/token`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            audience: AUTH0_MANAGEMENT_AUDIENCE,
            grant_type: "client_credentials",
            client_id: AUTH0_MANAGEMENT_CLIENT_ID,
            client_secret: AUTH0_MANAGEMENT_CLIENT_SECRET,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const token_data: Auth0Management.TokenResponse =
        (await response.json()) as Auth0Management.TokenResponse;

      await SaveAPIAuth(
        "Auth0 Management",
        token_data.access_token,
        token_data.expires_in
      );

      return token_data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<Auth0Management.ErrorResponse>;
        if (axiosError.response) {
          // Server responded with a non-2xx status code
          console.error("Server error:", axiosError.response.data);
        } else {
          // No response received
          console.error("Axios error, no response:", error.message);
        }
      } else {
        // Non-Axios error
        console.error("Unexpected error:", error);
      }
      throw error;
    }
  },

  Organizations: {
    async getOrganizations(
      params?: Auth0Management.Organizations.GetOrganizationsParams
    ): Promise<Auth0Management.Organizations.GetOrganizationsResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations`,
          params: params,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        console.log("Org Data:", data);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async createOrganization(
      params: Auth0Management.Organizations.CreateOrganizationParams
    ): Promise<Auth0Management.Organizations.Organization> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: params,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getOrganizationByName(
      name: string
    ): Promise<Auth0Management.Organizations.Organization> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/name/${name}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getOrganization(
      id: string
    ): Promise<Auth0Management.Organizations.Organization> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteOrganization(id: string): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async updateOrganization(
      params: Auth0Management.Organizations.UpdateOrganizationParams
    ): Promise<Auth0Management.Organizations.Organization> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...updateData } = params;
        const options = {
          method: "PATCH",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getConnections(
      params: Auth0Management.Organizations.GetConnectionsParams
    ): Promise<Auth0Management.Organizations.GetConnectionsResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...queryParams } = params;
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}/enabled_connections`,
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async addConnection(
      params: Auth0Management.Organizations.AddConnectionParams
    ): Promise<Auth0Management.Organizations.Connection> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...connectionData } = params;
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}/enabled_connections`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: connectionData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getConnection(
      orgId: string,
      connectionId: string
    ): Promise<Auth0Management.Organizations.Connection> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${orgId}/enabled_connections/${connectionId}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteConnection(orgId: string, connectionId: string): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${orgId}/enabled_connections/${connectionId}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async updateConnection(
      params: Auth0Management.Organizations.UpdateConnectionParams
    ): Promise<Auth0Management.Organizations.Connection> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, connection_id, ...updateData } = params;
        const options = {
          method: "PATCH",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}/enabled_connections/${connection_id}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getInvitations(
      params: Auth0Management.Organizations.GetInvitationsParams
    ): Promise<Auth0Management.Organizations.GetInvitationsResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...queryParams } = params;
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}/invitations`,
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async createInvitation(
      params: Auth0Management.Organizations.CreateInvitationParams
    ): Promise<Auth0Management.Organizations.CreateInvitationResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { organization_id, ...invitationData } = params;
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${organization_id}/invitations`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: invitationData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getInvitation(
      orgId: string,
      invitationId: string
    ): Promise<Auth0Management.Organizations.Invitation> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${orgId}/invitations/${invitationId}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteInvitation(orgId: string, invitationId: string): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${orgId}/invitations/${invitationId}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getMembers(
      params: Auth0Management.Organizations.GetMembersParams
    ): Promise<Auth0Management.Organizations.GetMembersResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...queryParams } = params;
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}/members`,
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteMembers(
      params: Auth0Management.Organizations.DeleteMembersParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${params.id}/members`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: { members: params.members },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async addMembers(
      params: Auth0Management.Organizations.AddMembersParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${params.id}/members`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: {
            members: params.members,
            roles: params.roles,
          },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getMemberRoles(
      params: Auth0Management.Organizations.GetMemberRolesParams
    ): Promise<Auth0Management.Organizations.GetMemberRolesResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, user_id, ...queryParams } = params;
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${id}/members/${user_id}/roles`,
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteRoles(
      params: Auth0Management.Organizations.DeleteRolesParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${params.id}/members/${params.user_id}/roles`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: { roles: params.roles },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async assignRoles(
      params: Auth0Management.Organizations.AssignRolesParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/organizations/${params.id}/members/${params.user_id}/roles`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: { roles: params.roles },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  },

  Clients: {
    async getClients(
      params?: Auth0Management.Clients.GetClientsParams
    ): Promise<Auth0Management.Clients.GetClientsResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/clients`,
          params: params,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        // API returns array directly
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getClient(clientId: string): Promise<Auth0Management.Clients.Client> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/clients/${clientId}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  },

  Roles: {
    async getRoles(
      params?: Auth0Management.Roles.GetRolesParams
    ): Promise<Auth0Management.Roles.GetRolesResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles`,
          params: params,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async createRole(
      params: Auth0Management.Roles.CreateRoleParams
    ): Promise<Auth0Management.Roles.Role> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: params,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getRole(id: string): Promise<Auth0Management.Roles.Role> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteRole(id: string): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async updateRole(
      params: Auth0Management.Roles.UpdateRoleParams
    ): Promise<Auth0Management.Roles.Role> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...updateData } = params;
        const options = {
          method: "PATCH",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${id}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getPermissions(
      params: Auth0Management.Roles.GetPermissionsParams
    ): Promise<Auth0Management.Roles.GetPermissionsResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...queryParams } = params;
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${id}/permissions`,
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async removePermissions(
      params: Auth0Management.Roles.RemovePermissionsParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${params.id}/permissions`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: { permissions: params.permissions },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async associatePermissions(
      params: Auth0Management.Roles.AssociatePermissionsParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${params.id}/permissions`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: { permissions: params.permissions },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getUsers(
      params: Auth0Management.Roles.GetUsersParams
    ): Promise<Auth0Management.Roles.GetUsersResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...queryParams } = params;
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${id}/users`,
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async assignUsers(
      params: Auth0Management.Roles.AssignUsersParams
    ): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/roles/${params.id}/users`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: { users: params.users },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  },

  Connections: {
    async getConnections(
      params?: Auth0Management.Connections.GetConnectionsParams
    ): Promise<Auth0Management.Connections.GetConnectionsResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/connections`,
          params: params,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async createConnection(
      params: Auth0Management.Connections.CreateConnectionParams
    ): Promise<Auth0Management.Connections.Connection> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/connections`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: params,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getConnection(
      id: string
    ): Promise<Auth0Management.Connections.Connection> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/connections/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteConnection(id: string): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/connections/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async updateConnection(
      params: Auth0Management.Connections.UpdateConnectionParams
    ): Promise<Auth0Management.Connections.Connection> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...updateData } = params;
        const options = {
          method: "PATCH",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/connections/${id}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  },

  Users: {
    async getUsers(
      params?: Auth0Management.Users.GetUsersParams
    ): Promise<Auth0Management.Users.GetUsersResponse> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/users`,
          params: params,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async createUser(
      params: Auth0Management.Users.CreateUserParams
    ): Promise<Auth0Management.Users.User> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "POST",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/users`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: params,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async getUser(id: string): Promise<Auth0Management.Users.User> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "GET",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async deleteUser(id: string): Promise<void> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const options = {
          method: "DELETE",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/${id}`,
          headers: { Authorization: `Bearer ${token}` },
        };
        await axios.request(options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async updateUser(
      params: Auth0Management.Users.UpdateUserParams
    ): Promise<Auth0Management.Users.User> {
      try {
        const token = await GetAPIAuth("Auth0 Management");
        const { id, ...updateData } = params;
        const options = {
          method: "PATCH",
          url: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/${id}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        };
        const { data } = await axios.request(options);
        return data;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
  },
};


