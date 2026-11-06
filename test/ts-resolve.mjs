// Lets Node's test runner resolve extensionless relative imports (as Metro does) to .ts files.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (err) {
      if (specifier.startsWith('.') && !/\.\w+$/.test(specifier)) return next(`${specifier}.ts`, context);
      throw err;
    }
  },
});
