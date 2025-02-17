# GraphQL Profile Page

## 📌 Objectives

The goal of this project is to learn and apply the GraphQL query language by building a profile page that fetches and displays user-specific data.

## 🏗 Features

- **User Authentication**: Implement a login page that supports both `username:password` and `email:password`.
- **GraphQL Queries**: Fetch and display relevant user information from the provided GraphQL API.
- **Dynamic UI**: A customizable profile UI that includes:
  - Basic user details (e.g., username, XP, grades, skills, etc.).
  - A **statistics section** with at least two **SVG-based graphs**.
- **JWT Authentication**: Secure access using JSON Web Tokens (JWT) obtained from the authentication endpoint.
- **Hosting**: The final profile must be deployed on a hosting platform such as GitHub Pages, Netlify, or Vercel.

## 🛠 Technologies Used

- **GraphQL** for querying data.
- **JWT (JSON Web Token)** for authentication.
- **HTML, CSS, JavaScript** for frontend development.
- **SVG** for generating interactive graphs.

## 🔗 API Endpoints

- **GraphQL Endpoint:** `https://((DOMAIN))/api/graphql-engine/v1/graphql`
- **Sign-in Endpoint:** `https://((DOMAIN))/api/auth/signin`

## 🏗 Project Structure

```
📂 graphql-profile
├── 📁 src
│   ├── 📄 index.html         # Profile Page
│   ├── 📄 login.html         # Login Page
│   ├── 📁 css
│   │   ├── 📄 styles.css      # Styles
│   ├── 📁 js
│   │   ├── 📄 auth.js        # Handles authentication
│   │   ├── 📄 graphql.js     # GraphQL queries
│   │   ├── 📄 charts.js      # Generates SVG-based graphs
├── 📄 README.md              # Project Documentation
└── 📄 package.json           # Dependencies (if applicable)
```

## 📊 Graphs to Implement

At least two different SVG-based graphs must be included. Possible options:

- XP progression over time
- XP earned per project
- Audit success/failure ratio
- Pass/Fail ratio for projects
- Piscine (JS/Go) statistics
- Number of attempts per exercise

## 🔑 Authentication Flow

1. User logs in via the **sign-in endpoint** using Basic Authentication (base64 encoded `username:password` or `email:password`).
2. A JWT is returned upon successful authentication.
3. The JWT is used as a **Bearer Token** in GraphQL queries.
4. The authenticated user’s ID can be extracted from the JWT payload.
5. The user can log out by clearing the stored JWT.

## 📝 Example GraphQL Queries

### Fetch User Info

```graphql
{
  user {
    id
    login
  }
}
```

### Fetch Project Data

```graphql
{
  object(where: { id: { _eq: 3323 } }) {
    name
    type
  }
}
```

### Fetch Nested Data

```graphql
{
  result {
    id
    user {
      id
      login
    }
  }
}
```

## 🚀 Deployment

1. Choose a hosting service (GitHub Pages, Netlify, Vercel, etc.).
2. Deploy the frontend files (`index.html`, `css`, `js`).
3. Ensure that the API endpoint is accessible from the hosting platform.

## 📚 Learning Outcomes

- Understanding **GraphQL Queries** (basic, nested, and with arguments).
- Implementing **JWT-based authentication**.
- Designing an interactive **UI with SVG-based statistics**.
- Deploying a frontend project to a live server.

---

🎯 **Final Goal:** Build an interactive, data-driven profile page using GraphQL while applying best practices in UI/UX and authentication.

Happy coding! 🚀
