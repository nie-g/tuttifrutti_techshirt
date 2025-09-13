### Milestone 1: Initial Setup & User Sign-Up

1.  **Dependencies**: Install and configure Clerk and Convex libraries.
2.  **Environment Variables**: Set up all the necessary environment variables for Clerk and Convex in a `.env.local` file.
3.  **Clerk Configuration**:
    *   Wrap the application with `<ClerkProvider>`.
    *   Create basic sign-up and sign-in pages using Clerk's components.
4.  **Convex Schema**:
    *   Define the `users` table in the Convex schema with `clerkId`, `email`, and `role` fields.
5.  **Convex `saveUser` Mutation**:
    *   Create a Convex mutation named `saveUser` that accepts `clerkId`, `email`, and `role`.
    *   The mutation will check if a user with the given `clerkId` already exists.
    *   If the user doesn't exist, it will create a new user with the provided details.
6.  **User Sign-Up Flow**:
    *   Create a sign-up page for regular users at `/signup/user`.
    *   Use the `<SignUp>` component from Clerk, configured to set `unsafeMetadata.userType` to `"user"`.
    *   After a successful sign-up and email verification, trigger the `saveUser` mutation with the role `"user"`.

### Milestone 2: Designer Sign-Up Flow (Invite-Only)

1.  **Invite Token Schema**:
    *   Create a new table in the Convex schema to store invitation tokens. This table will include fields like `token`, `expiresAt`, and `used`.
2.  **"Invite Designer" UI**:
    *   Create a new page for the Admin Dashboard.
    *   Add an "Invite Designer" button to this page.
3.  **Generate Invite Link**:
    *   Create a Convex mutation that generates a unique invitation token, stores it in the database, and returns it to the client.
    *   When the "Invite Designer" button is clicked, call this mutation to get a token.
    *   Construct an invitation link in the format `/signup/designer?token=XYZ`.
4.  **Designer Sign-Up Page**:
    *   Create a sign-up page at `/signup/designer`.
    *   This page should only be accessible with a valid, unused invitation token from the URL.
    *   Use the `<SignUp>` component, configured to set `unsafeMetadata.userType` to `"designer"`.
5.  **Designer Account Creation**:
    *   After a successful sign-up and email verification, trigger the `saveUser` mutation with the role `"designer"`.
    *   Mark the invitation token as "used" in the database.

### Milestone 3: Role-Based Access and Dashboards

1.  **Admin Role**:
    *   Manually set the role of at least one user to `"admin"` in the Convex database for testing purposes.
2.  **Fetch User Role**:
    *   Create a Convex query to fetch the current user's role from the `users` table based on their `clerkId`.
3.  **Role-Based Redirects**:
    *   After a user logs in, call the query to get their role.
    *   Based on the role, redirect the user to the appropriate dashboard:
        *   `user` -> `/dashboard/user`
        *   `designer` -> `/dashboard/designer`
        *   `admin` -> `/dashboard/admin`
4.  **Create Dashboards**:
    *   Create separate dashboard components for each role (`UserDashboard`, `DesignerDashboard`, `AdminDashboard`).
    *   Implement basic protected routes to ensure that only users with the correct role can access each dashboard.
