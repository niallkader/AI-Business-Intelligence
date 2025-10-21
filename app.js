import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import apiRoutes from './routes/api.routes.js';
import helmet from "helmet";

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

/*
//The CSP header set her by helmet are being overwritten by what I had to do in the .htacces file to overrite the default CSP that cPanel sets

Here's what I had to add to the .htacces file in the app root folder to overwrite the default CSP in cPanel:
<IfModule mod_headers.c>
    # Unset the default CSP header that cPanel/Apache is injecting
    Header unset Content-Security-Policy
    
    # 🚨 AGGRESSIVE OVERWRITE: Set a blank CSP header. 
    # The 'always' condition ensures this runs at the end of the request.
    Header always set Content-Security-Policy ""
</IfModule>


app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": [
          "'self'",
          "https://cdn.jsdelivr.net",   // for danfojs and axios
          "https://www.gstatic.com",    // for Google Charts
          "'unsafe-inline'",             // (optional) if you use inline scripts
        ],
        "connect-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://www.gstatic.com",
        ],
      },
    },
  })
);
*/

// set the public folder to serve static files
app.use(express.static('public'));

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});
