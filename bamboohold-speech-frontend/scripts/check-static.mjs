#!/usr/bin/env node

/**
 * Check for violations of static export constraints
 * Scans codebase for SSR/ISR/API Route patterns that break static export
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRONTEND_ROOT = join(__dirname, "..");
const DIRS_TO_CHECK = ["app", "pages", "components"];

// Patterns that violate static export
const VIOLATIONS = {
  SSR: {
    pattern: /getServerSideProps|unstable_getServerProps/g,
    description: "Server-Side Rendering (getServerSideProps)",
  },
  ISR: {
    pattern: /getStaticProps.*revalidate|unstable_revalidate/g,
    description: "Incremental Static Regeneration (revalidate)",
  },
  SERVER_ACTIONS: {
    pattern: /"use server"|'use server'/g,
    description: "Server Actions (use server directive)",
  },
  API_ROUTES: {
    pattern: /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g,
    description: "API Routes (route handlers)",
  },
  SERVER_IMPORTS: {
    pattern: /from\s+['"]next\/headers['"]|from\s+['"]server-only['"]/g,
    description: "Server-only imports (next/headers, server-only)",
  },
  COOKIES: {
    pattern: /cookies\(\)|headers\(\)/g,
    description: "Server functions (cookies, headers)",
  },
  DYNAMIC_FORCE: {
    pattern: /dynamic\s*=\s*['"]force-dynamic['"]/g,
    description: "Force-dynamic export",
  },
};

let hasErrors = false;
const violations = [];

/**
 * Recursively scan directory for TypeScript/JavaScript files
 */
function scanDirectory(dir, baseDir = dir) {
  if (!existsSync(dir)) {
    return;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!entry.startsWith(".") && entry !== "node_modules") {
        scanDirectory(fullPath, baseDir);
      }
    } else if (stat.isFile()) {
      // Check TypeScript and JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
        checkFile(fullPath, baseDir);
      }
    }
  }
}

/**
 * Check a single file for violations
 */
function checkFile(filePath, baseDir) {
  const content = readFileSync(filePath, "utf-8");
  const relativePath = filePath.replace(baseDir + "/", "");

  for (const [key, { pattern, description }] of Object.entries(VIOLATIONS)) {
    const matches = content.match(pattern);
    if (matches) {
      hasErrors = true;
      violations.push({
        file: relativePath,
        type: key,
        description,
        count: matches.length,
      });
    }
  }
}

/**
 * Check for dynamic routes without generateStaticParams
 */
function checkDynamicRoutes() {
  const appDir = join(FRONTEND_ROOT, "app");
  if (!existsSync(appDir)) {
    return;
  }

  function checkDir(dir, baseDir = dir) {
    const entries = readdirSync(dir);
    const hasDynamicSegment = entries.some((e) => e.startsWith("["));

    if (hasDynamicSegment) {
      // Check if generateStaticParams exists
      const pageFiles = ["page.tsx", "page.ts", "page.jsx", "page.js"];
      let hasGenerateStaticParams = false;

      for (const pageFile of pageFiles) {
        const pagePath = join(dir, pageFile);
        if (existsSync(pagePath)) {
          const content = readFileSync(pagePath, "utf-8");
          if (/export\s+(async\s+)?function\s+generateStaticParams/.test(content)) {
            hasGenerateStaticParams = true;
            break;
          }
        }
      }

      if (!hasGenerateStaticParams) {
        hasErrors = true;
        const relativePath = dir.replace(baseDir + "/", "");
        violations.push({
          file: relativePath,
          type: "DYNAMIC_ROUTE",
          description: "Dynamic route without generateStaticParams",
          count: 1,
        });
      }
    }

    // Recurse into subdirectories
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory() && !entry.startsWith(".")) {
        checkDir(fullPath, baseDir);
      }
    }
  }

  checkDir(appDir);
}

/**
 * Check for api directory in app/ or pages/
 */
function checkApiDirectories() {
  const apiDirs = [join(FRONTEND_ROOT, "app", "api"), join(FRONTEND_ROOT, "pages", "api")];

  for (const apiDir of apiDirs) {
    if (existsSync(apiDir)) {
      hasErrors = true;
      const relativePath = apiDir.replace(FRONTEND_ROOT + "/", "");
      violations.push({
        file: relativePath,
        type: "API_DIRECTORY",
        description: "API directory exists (not allowed for static export)",
        count: 1,
      });
    }
  }
}

// Main execution
console.log("=== Static Export Validation ===");
console.log(`Checking: ${DIRS_TO_CHECK.join(", ")}\n`);

// Scan each directory
for (const dir of DIRS_TO_CHECK) {
  const fullPath = join(FRONTEND_ROOT, dir);
  scanDirectory(fullPath);
}

// Additional checks
checkDynamicRoutes();
checkApiDirectories();

// Report results
if (hasErrors) {
  console.error("✗ Found violations of static export constraints:\n");

  // Group violations by file
  const byFile = {};
  for (const violation of violations) {
    if (!byFile[violation.file]) {
      byFile[violation.file] = [];
    }
    byFile[violation.file].push(violation);
  }

  for (const [file, fileViolations] of Object.entries(byFile)) {
    console.error(`  ${file}:`);
    for (const v of fileViolations) {
      console.error(`    - ${v.description} (${v.count} occurrence${v.count > 1 ? "s" : ""})`);
    }
  }

  console.error("\nPlease fix these issues before building for static export.");
  process.exit(1);
} else {
  console.log("✓ No static export violations found");
  process.exit(0);
}

