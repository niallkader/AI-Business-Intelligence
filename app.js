import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import apiRoutes from './routes/api.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// HTTP to HTTPS redirect (only in production environment)
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy'); 
  app.use((req, res, next) => {  
    if (req.secure) {
      // Request is already HTTPS, continue to the next middleware
      next();
    }else{
      // Redirect to HTTPS with 301 status code
      res.redirect(301, 'https://' + req.headers.host + req.url);
    }
  });
}

app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));

// set the public folder to serve static files
app.use(express.static('public'));

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});
