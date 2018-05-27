module.exports = {
    preset: "jest-preset-angular",
    roots: ["src"],
    setupTestFrameworkScriptFile: "<rootDir>/src/test.ts",
    transformIgnorePatterns: [
        "node_modules/(?!(@angular/common/locales))"
    ]
}
