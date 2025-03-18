// Mock authentication middleware for development
const authMiddleware = (req, res, next) => {
    const header = req.headers['x-ms-client-principal'];

    // Check if the user is authenticated
    if (!header) {
      return res.status(401).send('Unauthorized');
    }
  
    // Hardcode admin user emails or usernames (you can customize this list)
    const adminUsers = ['ana.benabbou@dkm-customs.com'];
    
    if (header) {
      try {
        const decoded = Buffer.from(header, 'base64').toString('utf-8');
        const parsedData = JSON.parse(decoded);
        
        // Extract claims
        const claims = parsedData.claims || [];
        
        // Extract required values
        const emailClaim = claims.find(claim => claim.typ.includes('emailaddress'));
        const nameClaim = claims.find(claim => claim.typ === 'name');
  
        // Assign roles based on email
        req.user = {
          username: nameClaim ? nameClaim.val : null,
          email: emailClaim ? emailClaim.val : null,
          role: adminUsers.includes(emailClaim ? emailClaim.val : '') ? 'Admin' : 'User', // Default role is 'User'
        };
      } catch (error) {
        console.error('Error decoding auth header:', error);
        req.user = null;
      }
    } else {
      req.user = null;
    }
  
    next();
  };

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.user) {
      next();
    } else {
      console.log('User not authenticated, redirecting to /');
      res.redirect('/');
    }
}

module.exports = {
    authMiddleware,
    requireAuth
};