module.exports = {
  '*.{ts,tsx}': (filenames) => [
    `eslint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
  ],
  '*.scss': (filenames) => `stylelint --fix ${filenames.join(' ')}`,
  '*.{html,css,js,json,md,yml}': (filenames) => `git add ${filenames.join(' ')}`,
};
