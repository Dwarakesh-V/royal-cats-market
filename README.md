# Royal Cats Market - Google Drive MCP Integration

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server built with [NitroStack](https://nitrostack.ai) to seamlessly integrate Google Drive with AI agents.

This server provides tools to authenticate users securely via OAuth 2.0, recursively navigate their Google Drive directories, and read file contents directly (including native on-the-fly conversion of Google Docs and Google Sheets into plain text and CSV).

## Features & Tools

This MCP server exposes three main tools:

1. **`generate_auth_url`**
   Generates a Google OAuth authorization URL. The user must visit this URL in their browser to grant the application permission to access their Google Drive.

2. **`list_files`**
   Lists up to 50 files/folders from a specific folder. 
   - Accepts an optional `folder_id` (defaults to `"root"`).
   - Returns file names, IDs, and MIME types to allow recursive navigation.

3. **`read_file`**
   Retrieves the contents of a file as a **Base64 encoded string**.
   - **Google Workspace Support**: Automatically detects Google Docs and Google Sheets, natively exporting them to plain text (`text/plain`) and CSV (`text/csv`) respectively before Base64 encoding.
   - **Standard Files**: Safely fetches raw media for text files, PDFs, images, etc.

## Prerequisites

You need a **Google Cloud Console** project with the **Google Drive API** enabled and an **OAuth 2.0 Client ID** configured.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Drive API**.
3. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
4. Under **Authorized redirect URIs**, add exactly the URI where your server will receive the callback. 
   - *Local testing:* `http://localhost:3000/auth/callback`
   - *Production:* `https://your-app-name.app.nitrocloud.ai/auth/callback`

## Local Development Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root of the project with your Google OAuth credentials:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
   GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

3. **Run the Server**
   ```bash
   npm start
   ```
   *Note: If you make changes to your `.env` file, you must fully restart this terminal process (Ctrl+C) for the changes to take effect.*

4. **Connect NitroStudio**
   To test the tools locally using [NitroStudio](https://nitrostack.ai/studio), add a new server connection:
   - **Connection Type**: `HTTP / SSE`
   - **URL**: `http://localhost:3000/sse`

## Application Architecture

- `src/app.module.ts`: Core MCP app definition and module injection.
- `src/index.ts`: The main entry point, bootstraps the MCP transport layer and hosts the custom Express route (`/auth/callback`) to handle the Google OAuth redirect and render the styled "Royal Cats" success page.
- `src/modules/oauth/oauth.service.ts`: Handles all Google APIs interactions (`googleapis`), OAuth token exchanges, and fetching/exporting Drive data.
- `src/modules/oauth/oauth.controller.ts`: Registers and exposes the functions as documented MCP `@Tool` decorators to the AI client.
