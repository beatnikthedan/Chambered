import { defineConfig } from "orval";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default defineConfig({
  petstore: {
    input: {
      target: "http://localhost:5001/swagger/v1/swagger.json",
    },
    output: {
      target: "./src/api/endpoints.ts",
      schemas: "./src/api/models",
      client: "react-query",
      mock: true,
    },
  },
});
