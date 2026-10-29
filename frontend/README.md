# Frontend

The Meeting Intelligence Agent frontend is built with React and Vite. For complete setup instructions, backend configuration, API documentation, and the product demonstration, see the [project README](../README.md).

## Run the development server

From this directory, install dependencies and start Vite:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

The frontend expects the FastAPI backend at `http://127.0.0.1:8765`; Vite proxies `/api` requests to that address.
