# ============================================
# 📦 SWAGGER/OPENAPI SETUP GUIDE
# ============================================

## 🎯 Installation

### Step 1: Install Swagger CLI (Required)

# Option 1: Global installation (recommended)
npm install -g @apidevtools/swagger-cli

# Option 2: Dev dependency (project-specific)
npm install --save-dev @apidevtools/swagger-cli

### Step 2: Install Spectral Linter (Optional but recommended)

npm install -g @stoplight/spectral-cli

### Step 3: Verify Installation

swagger-cli --version
spectral --version

## 🚀 Usage

### Generate bundled documentation
npm run docs:bundle

### Validate OpenAPI spec
npm run docs:validate

### Lint for best practices
npm run docs:lint

### Watch mode (auto-rebuild on changes)
npm run docs:watch

## 📝 Scripts Explained

# docs:bundle
# - Reads docs/index.yaml
# - Resolves all $ref references
# - Outputs swagger-bundled.json
# - Uses --dereference to inline all references

# docs:validate
# - Checks OpenAPI spec is valid
# - Reports errors with line numbers
# - Must pass before committing

# docs:lint
# - Checks for best practices
# - Style guide violations
# - Security issues

# docs:watch
# - Runs docs:bundle automatically
# - Watches all files in docs/ folder
# - Perfect for development

# prestart
# - Runs before "npm start"
# - Ensures bundled file is up-to-date
# - Automatic in production

## ⚙️ Configuration

No additional configuration needed! Everything is pre-configured.

The swagger-cli will:
✅ Follow $ref links
✅ Merge all YAML files
✅ Validate schemas
✅ Generate JSON output
✅ Dereference (inline) all references

## 🔧 Troubleshooting

### Error: "swagger-cli: command not found"
Solution: npm install -g @apidevtools/swagger-cli

### Error: "Cannot find module"
Solution: Ensure all paths in $ref use relative paths with ../

### Error: "Validation failed"
Solution: Run npm run docs:validate to see detailed errors

### Error: "Path encoding issues"
Solution: Use JSON Pointer notation: / becomes ~1

Example:
/api/auth/login → ~1api~1auth~1login

## 📦 CI/CD Integration

# .github/workflows/docs.yml
name: Validate API Docs
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @apidevtools/swagger-cli
      - run: npm run docs:validate

## 🎨 Swagger UI Setup

Already configured in app.js or server.js:

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-bundled.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

Access at: http://localhost:5000/api-docs

## 🔄 Development Workflow

1. Edit YAML files in docs/
2. Run: npm run docs:validate
3. Run: npm run docs:bundle
4. Test in Swagger UI
5. Commit changes (including bundled JSON)

## 📚 Resources

- Swagger CLI: https://github.com/APIDevTools/swagger-cli
- OpenAPI 3.0 Spec: https://swagger.io/specification/
- Spectral Linter: https://stoplight.io/open-source/spectral
