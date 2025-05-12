// auth0-management.d.ts

export namespace Auth0Management {
  // Error Response
  interface ErrorResponse {
    statusCode: number;
    error: string;
    message: string;
  }

  namespace Organizations {
    interface Organization {
      id: string;
      name: string;
      display_name: string;
      branding?: {
        logo_url?: string;
        colors?: {
          primary?: string;
          page_background?: string;
        };
      };
      metadata?: Record<string, any>;
      created_at?: string;
      updated_at?: string;
    }

    interface GetOrganizationsParams {
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      from?: string;
      take?: number;
      sort?: string;
      fields?: string;
      include_fields?: boolean;
      name_filter?: string;
    }

    interface PagedResponse<T> {
      start: number;
      limit: number;
      total: number;
      length: number;
      items: T[];
    }

    // The API returns an array of organizations directly
    type GetOrganizationsResponse = Organization[];

    interface CreateOrganizationConnectionsParams {
      connection_id: string;
      assign_membership_on_login: true;
      show_as_button: true;
      is_signup_enabled?: boolean;
    }

    interface CreateOrganizationParams {
      name: string;
      display_name: string;
      branding?: {
        logo_url?: string;
        colors?: {
          primary?: string;
          page_background?: string;
        };
      };
      metadata?: Record<string, any>;
      enabled_connections: CreateOrganizationConnectionsParams[];
    }

    interface UpdateOrganizationParams {
      id: string;
      name?: string;
      display_name?: string;
      branding?: {
        logo_url?: string;
        colors?: {
          primary?: string;
          page_background?: string;
        };
      };
      metadata?: Record<string, any>;
    }

    interface Connection {
      connection_id: string;
      assign_membership_on_login?: boolean;
      connection: {
        name: string;
        strategy: string;
      };
    }

    interface GetConnectionsParams {
      id: string;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
    }

    // The API might return an array of connections directly
    type GetConnectionsResponse = Connection[];

    interface AddConnectionParams {
      id: string;
      connection_id: string;
      assign_membership_on_login?: boolean;
    }

    interface UpdateConnectionParams {
      id: string;
      connection_id: string;
      assign_membership_on_login?: boolean;
    }

    interface Invitation {
      id: string;
      organization_id: string;
      inviter: {
        name: string;
      };
      invitee: {
        email: string;
      };
      invitation_url: string;
      created_at: string;
      expires_at: string;
      client_id?: string;
      connection_id?: string;
      mfa_token?: string;
      roles?: string[];
      ticket_id?: string;
    }

    interface GetInvitationsParams {
      id: string;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      sort?: string;
      fields?: string;
      include_fields?: boolean;
    }

    // The API might return invitations as an array
    type GetInvitationsResponse = Invitation[];

    interface CreateInvitationParams {
      inviter: {
        name: string;
      };
      invitee: {
        email: string;
      };
      client_id?: string;
      connection_id?: string;
      ttl_sec?: number;
      roles?: string[];
      send_invitation_email?: boolean;
      organization_id: string;
    }

    interface CreateInvitationResponse extends Invitation {}

    interface Member {
      user_id: string;
      email: string;
      name?: string;
      picture?: string;
      roles?: string[];
    }

    interface GetMembersParams {
      id: string;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      from?: string;
      take?: number;
      sort?: string;
      fields?: string;
      include_fields?: boolean;
    }

    // The API might return members as an array
    type GetMembersResponse = Member[];

    interface AddMembersParams {
      id: string;
      members: string[];
      roles?: string[];
    }

    interface DeleteMembersParams {
      id: string;
      members: string[];
    }

    interface GetMemberRolesParams {
      id: string;
      user_id: string;
      page?: number;
      per_page?: number;
    }

    // The API might return roles as an array
    type GetMemberRolesResponse = {
      id: string;
      name: string;
      description?: string;
    }[];

    interface AssignRolesParams {
      id: string;
      user_id: string;
      roles: string[];
    }

    interface DeleteRolesParams {
      id: string;
      user_id: string;
      roles: string[];
    }

    interface API {
      getOrganizations(
        params?: GetOrganizationsParams
      ): Promise<GetOrganizationsResponse>;
      createOrganization(
        params: CreateOrganizationParams
      ): Promise<Organization>;
      getOrganizationByName(name: string): Promise<Organization>;
      getOrganization(id: string): Promise<Organization>;
      deleteOrganization(id: string): Promise<void>;
      updateOrganization(
        params: UpdateOrganizationParams
      ): Promise<Organization>;
      getConnections(
        params: GetConnectionsParams
      ): Promise<GetConnectionsResponse>;
      addConnection(params: AddConnectionParams): Promise<Connection>;
      getConnection(orgId: string, connectionId: string): Promise<Connection>;
      deleteConnection(orgId: string, connectionId: string): Promise<void>;
      updateConnection(params: UpdateConnectionParams): Promise<Connection>;
      getInvitations(
        params: GetInvitationsParams
      ): Promise<GetInvitationsResponse>;
      createInvitation(
        params: CreateInvitationParams
      ): Promise<CreateInvitationResponse>;
      getInvitation(orgId: string, invitationId: string): Promise<Invitation>;
      deleteInvitation(orgId: string, invitationId: string): Promise<void>;
      getMembers(params: GetMembersParams): Promise<GetMembersResponse>;
      deleteMembers(params: DeleteMembersParams): Promise<void>;
      addMembers(params: AddMembersParams): Promise<void>;
      getMemberRoles(
        params: GetMemberRolesParams
      ): Promise<GetMemberRolesResponse>;
      deleteRoles(params: DeleteRolesParams): Promise<void>;
      assignRoles(params: AssignRolesParams): Promise<void>;
    }
  }

  namespace Clients {
    interface Client {
      client_id: string;
      tenant: string;
      name: string;
      description?: string;
      global?: boolean;
      client_secret?: string;
      app_type?: string;
      logo_uri?: string;
      is_first_party?: boolean;
      oidc_conformant?: boolean;
      callbacks?: string[];
      allowed_origins?: string[];
      web_origins?: string[];
      client_aliases?: string[];
      allowed_clients?: string[];
      allowed_logout_urls?: string[];
      grant_types?: string[];
      jwt_configuration?: {
        lifetime_in_seconds?: number;
        secret_encoded?: boolean;
        alg?: string;
        scopes?: Record<string, any>;
      };
      encryption_key?: {
        pub?: string;
        cert?: string;
      };
      sso?: boolean;
      sso_disabled?: boolean;
      cross_origin_auth?: boolean;
      cross_origin_loc?: string;
      custom_login_page_on?: boolean;
      custom_login_page?: string;
      custom_login_page_preview?: string;
      form_template?: string;
      addons?: Record<string, any>;
      token_endpoint_auth_method?: string;
      client_metadata?: Record<string, string>;
      mobile?: {
        android?: {
          app_package_name?: string;
          sha256_cert_fingerprints?: string[];
        };
        ios?: {
          team_id?: string;
          app_bundle_identifier?: string;
        };
      };
      initiate_login_uri?: string;
      native_social_login?: {
        apple?: {
          enabled?: boolean;
        };
        facebook?: {
          enabled?: boolean;
        };
      };
      refresh_token?: {
        rotation_type?: string;
        expiration_type?: string;
        leeway?: number;
        token_lifetime?: number;
        infinite_token_lifetime?: boolean;
        idle_token_lifetime?: number;
        infinite_idle_token_lifetime?: boolean;
      };
      organization_usage?: string;
      organization_require_behavior?: string;
      client_authentication_methods?: {
        private_key_jwt?: {
          credentials?: {
            key_id?: string;
            algorithm?: string;
            public_key?: string;
          }[];
        };
      };
    }

    interface GetClientsParams {
      fields?: string;
      include_fields?: boolean;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      is_global?: boolean;
      is_first_party?: boolean;
      app_type?: string;
    }

    // The API returns an array of clients
    type GetClientsResponse = Client[];

    interface API {
      getClients(params?: GetClientsParams): Promise<GetClientsResponse>;
      getClient(clientId: string): Promise<Client>;
    }
  }

  namespace Roles {
    interface Role {
      id: string;
      name: string;
      description?: string;
      created_at: string;
      updated_at: string;
    }

    interface GetRolesParams {
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      name_filter?: string;
    }

    // The API might return an array of roles directly
    type GetRolesResponse = Role[];

    interface CreateRoleParams {
      name: string;
      description?: string;
    }

    interface UpdateRoleParams {
      id: string;
      name?: string;
      description?: string;
    }

    interface Permission {
      resource_server_identifier: string;
      resource_server_name?: string;
      permission_name: string;
      description?: string;
    }

    interface GetPermissionsParams {
      id: string;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
    }

    // The API might return permissions as an array
    type GetPermissionsResponse = Permission[];

    interface AssociatePermissionsParams {
      id: string;
      permissions: {
        resource_server_identifier: string;
        permission_name: string;
      }[];
    }

    interface RemovePermissionsParams {
      id: string;
      permissions: {
        resource_server_identifier: string;
        permission_name: string;
      }[];
    }

    interface GetUsersParams {
      id: string;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      from?: string;
      take?: number;
    }

    // The API might return users as an array
    type GetUsersResponse = {
      user_id: string;
      name: string;
      email: string;
      picture?: string;
    }[];

    interface AssignUsersParams {
      id: string;
      users: string[];
    }

    interface API {
      getRoles(params?: GetRolesParams): Promise<GetRolesResponse>;
      createRole(params: CreateRoleParams): Promise<Role>;
      getRole(id: string): Promise<Role>;
      deleteRole(id: string): Promise<void>;
      updateRole(params: UpdateRoleParams): Promise<Role>;
      getPermissions(
        params: GetPermissionsParams
      ): Promise<GetPermissionsResponse>;
      removePermissions(params: RemovePermissionsParams): Promise<void>;
      associatePermissions(params: AssociatePermissionsParams): Promise<void>;
      getUsers(params: GetUsersParams): Promise<GetUsersResponse>;
      assignUsers(params: AssignUsersParams): Promise<void>;
    }
  }

  namespace Connections {
    interface Connection {
      id: string;
      name: string;
      strategy: string;
      options: Record<string, any>;
      enabled_clients: string[];
      is_domain_connection: boolean;
      metadata?: Record<string, any>;
      realms?: string[];
      created_at: string;
      updated_at: string;
    }

    interface GetConnectionsParams {
      strategy?: string;
      name?: string;
      fields?: string;
      include_fields?: boolean;
      page?: number;
      per_page?: number;
      include_totals?: boolean;
    }

    type GetConnectionsResponse = Connection[];

    interface CreateConnectionParams {
      name: string;
      strategy: string;
      options?: Record<string, any>;
      enabled_clients?: string[];
      metadata?: Record<string, any>;
      realms?: string[];
    }

    interface UpdateConnectionParams {
      id: string;
      name?: string;
      options?: Record<string, any>;
      enabled_clients?: string[];
      metadata?: Record<string, any>;
      realms?: string[];
    }

    interface API {
      getConnections(
        params?: GetConnectionsParams
      ): Promise<GetConnectionsResponse>;
      createConnection(params: CreateConnectionParams): Promise<Connection>;
      getConnection(id: string): Promise<Connection>;
      deleteConnection(id: string): Promise<void>;
      updateConnection(params: UpdateConnectionParams): Promise<Connection>;
    }
  }

  namespace Users {
    interface User {
      user_id: string;
      email: string;
      email_verified: boolean;
      username?: string;
      phone_number?: string;
      phone_verified?: boolean;
      created_at: string;
      updated_at: string;
      identities: {
        connection: string;
        user_id: string;
        provider: string;
        isSocial: boolean;
      }[];
      app_metadata?: Record<string, any>;
      user_metadata?: Record<string, any>;
      picture?: string;
      name?: string;
      nickname?: string;
      multifactor?: string[];
      last_ip?: string;
      last_login?: string;
      logins_count?: number;
      blocked?: boolean;
      given_name?: string;
      family_name?: string;
    }

    interface GetUsersParams {
      sort?: string;
      q?: string;
      search_engine?: "v3";
      page?: number;
      per_page?: number;
      include_totals?: boolean;
      fields?: string;
      include_fields?: boolean;
    }

    // The API might return an array of users directly
    type GetUsersResponse = User[];

    interface CreateUserParams {
      email?: string;
      phone_number?: string;
      user_metadata?: Record<string, any>;
      blocked?: boolean;
      email_verified?: boolean;
      phone_verified?: boolean;
      app_metadata?: Record<string, any>;
      given_name?: string;
      family_name?: string;
      name?: string;
      nickname?: string;
      picture?: string;
      user_id?: string;
      connection: string;
      password?: string;
      verify_email?: boolean;
      username?: string;
    }

    interface UpdateUserParams {
      id: string;
      email?: string;
      phone_number?: string;
      user_metadata?: Record<string, any>;
      blocked?: boolean;
      email_verified?: boolean;
      phone_verified?: boolean;
      app_metadata?: Record<string, any>;
      given_name?: string;
      family_name?: string;
      name?: string;
      nickname?: string;
      picture?: string;
      username?: string;
      password?: string;
      verify_email?: boolean;
      verify_phone_number?: boolean;
      connection?: string;
    }

    interface API {
      getUsers(params?: GetUsersParams): Promise<GetUsersResponse>;
      createUser(params: CreateUserParams): Promise<User>;
      getUser(id: string): Promise<User>;
      deleteUser(id: string): Promise<void>;
      updateUser(params: UpdateUserParams): Promise<User>;
    }
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: "Bearer";
  }

  interface API {
    getToken(): Promise<TokenResponse>;
    Organizations: Organizations.API;
    Roles: Roles.API;
    Connections: Connections.API;
    Users: Users.API;
    Clients: Clients.API;
  }
}
