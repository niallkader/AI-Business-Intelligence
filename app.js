import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import apiRoutes from './routes/api.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
// set the public folder to serve static files
app.use(express.static('public'));

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});
