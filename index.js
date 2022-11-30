const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const YAML = require('yamljs');
require("dotenv").config();
const logger = require('./utils/logger');
const path = require('path');
const app = express();

const swaggerUi = require('swagger-ui-express');

const ROOT_FOLDER = path.join(path.resolve(), '.');
const {
    notFound,
    errorHandling
} = require('./middleware/errorHandler');





app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(cors());
const mongodbString = process.env.DATABASE_URL;
mongoose.connect(mongodbString);
const database = mongoose.connection;



database.once("connected", () => {
    logger.info("Database is connected");
});

const swaggerDocument = YAML.load(path.join(path.resolve(), './docs/swagger.yml'));
const options = {
    customCssUrl: './public/swagger-ui.css',
    customSiteTitle: "Qr Server API - Swagger"
};

app.use('/var/task/uploads', express.static(path.join(ROOT_FOLDER, 'uploads')));
app.use('/api/api-docs/swagger-ui.css', express.static(path.join(ROOT_FOLDER, 'public/swagger-ui.css')));
app.use('/api/api-docs', swaggerUi.serve);
app.use('/api/api-docs', swaggerUi.setup(swaggerDocument, options));



app.use("/api/admin", require("./routes/admin"));
app.use("/api/canteen", require("./routes/canteen"));
app.use("/api/participant", require("./routes/participant"));


app.use(notFound);
app.use(errorHandling);
let port = process.env.port || 4000;
app.listen(port, () => {
    logger.debug(`Server is running on port ${port}`);
});