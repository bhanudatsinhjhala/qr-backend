const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const YAML = require('yamljs');
require("dotenv").config();
const logger = require('./utils/logger');
const path = require('path');
const app = express();

// const swaggerUi = require('swagger-ui-express');

const ApiError = require('../src/utils/ApiError')

const {
    errorConverter,
    errorHandler
} = require('./middleware/error');


const ROOT_FOLDER = path.join(path.resolve(), '.');



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

// const swaggerDocument = YAML.load(path.join(path.resolve(), './src/docs/swagger.yml'));
// const options = {
//     customCssUrl: './public/swagger-ui.css',
//     customSiteTitle: "Qr Server API - Swagger"
// };
// app.use('/uploads', express.static(path.join(ROOT_FOLDER, 'uploads')));
// app.use('/api/api-docs/swagger-ui.css', express.static(path.join(ROOT_FOLDER, 'public/swagger-ui.css')));
// app.use('/api/api-docs', swaggerUi.serve);
// app.use('/api/api-docs', swaggerUi.setup(swaggerDocument, options));



app.use("/api/admin", require("./routes/admin"));
app.use("/api/canteen", require("./routes/canteen"));
app.use("/api/participant", require("./routes/participant"));

app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not Found'));
});
app.use(errorConverter);
app.use(errorHandler);
let port = process.env.port || 4000;
app.listen(port, () => {
    logger.debug(`Server is running on port ${port}`);
});