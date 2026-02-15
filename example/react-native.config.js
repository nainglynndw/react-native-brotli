const path = require('path');
const pkg = require('../package.json');
const usePackedBrotli = process.env.BROTLI_SOURCE === 'tgz';

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: usePackedBrotli
    ? {}
    : {
        [pkg.name]: {
          root: path.join(__dirname, '..'),
          platforms: {
            // Codegen script incorrectly fails without this
            // So we explicitly specify the platforms with empty object
            ios: {},
            android: {},
          },
        },
      },
};
