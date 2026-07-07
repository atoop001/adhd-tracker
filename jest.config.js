/** Jest config for Flux. Uses ts-jest so tests run directly against the
 *  TypeScript source — no separate compile step needed.
 *
 *  devDependencies: jest, ts-jest, @types/jest, typescript,
 *                    better-sqlite3, @types/better-sqlite3
 *
 *  package.json script: "test": "jest"
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
};
