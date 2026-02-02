# ============================================
# IMPORTANT: WHAT TO COMMIT VS IGNORE
# ============================================

## ✅ ALWAYS COMMIT (Source of Truth)

docs/
├── index.yaml          ✅ COMMIT
├── components/         ✅ COMMIT ALL
│   ├── schemas.yaml
│   ├── responses.yaml
│   ├── parameters.yaml
│   └── security.yaml
└── paths/              ✅ COMMIT ALL
    ├── auth.yaml
    ├── campaigns.yaml
    └── admin.yaml

## ⚠️ GENERATED FILE (Should be committed for production)

swagger-bundled.json    ✅ COMMIT (but auto-generated)

Why commit the bundled file?
- Ensures production has latest docs
- CI/CD can serve it without build step
- Swagger UI needs it at runtime

Alternative: Add to .gitignore and build in CI/CD

## ❌ NEVER COMMIT

node_modules/           ❌ IGNORE
.env                    ❌ IGNORE
*.log                   ❌ IGNORE

## 🔧 Recommended .gitignore Entry

# If you prefer to generate on server startup:
# swagger-bundled.json

# Most projects commit the bundled file for deployment simplicity
