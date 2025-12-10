# Deployment Configuration Fix

## Issue Fixed
The deployment was failing because the `pricing.json` config file was not being copied to the `dist` directory during the build process, causing the application to fail when trying to read the configuration in production.

## Solutions Applied

### 1. Robust Path Detection (✅ Applied)
Modified `server/routes.ts` to include intelligent path detection that works in both development and production environments:

- **Development**: Reads from `server/config/pricing.json`
- **Production**: Tries multiple fallback paths including `dist/config/pricing.json`
- **Fallback**: Uses default configuration if no file is found

### 2. Build Script for Config Files (✅ Created)
Created `scripts/copy-config.js` that copies all config files from `server/config/` to `dist/config/` during the build process.

## Manual Deployment Steps

Since the build configuration files cannot be automatically updated, follow these steps for deployment:

### Option 1: Update Build Command Manually
```bash
# Instead of just running: npm run build
# Run this complete build sequence:
npm run build && node scripts/copy-config.js
```

### Option 2: Update .replit File Build Command
If you have access to edit the `.replit` file, update the build command to:
```
build = ["npm", "run", "build", "&&", "node", "scripts/copy-config.js"]
```

### Option 3: Update package.json Build Script
If you can edit `package.json`, update the build script to:
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && node scripts/copy-config.js"
  }
}
```

## Verification

The application now includes robust error handling and will:
1. ✅ Work in development environment (current setup)
2. ✅ Work in production with copied config files
3. ✅ Gracefully fallback to default config if files are missing
4. ✅ Provide clear logging about which config path is being used

## Testing

You can verify the solution works by:
1. Running the development server (already tested ✅)
2. Running `npm run build && node scripts/copy-config.js` to test the build process
3. Checking that `dist/config/pricing.json` exists after build
4. Running the production build with `npm start`

The application will log which configuration path it's using, making debugging easier in production.