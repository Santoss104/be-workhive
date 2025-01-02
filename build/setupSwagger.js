import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
dotenv.config();
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "WorkHive API Documentation",
            version: "1.0.0",
            description: "API documentation for WorkHive application",
        },
        servers: [
            {
                url: process.env.BACKEND_URI,
                description: "Production server",
            },
            {
                url: "http://localhost:5000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./routes/*.ts", "./models/*.ts"],
};
const swaggerSpec = swaggerJsdoc(options);
const swaggerDocs = (app, port) => {
    // Swagger page
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    // Docs in JSON format
    app.get("/docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
    console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
};
export default swaggerDocs;
