// stylelint.config.js
module.exports = {
  ignoreFiles: ['dist/**', 'schematics/**'], // 忽略编译输出和工具脚本
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-scss',
    'stylelint-config-recess-order',
  ],
  plugins: ['stylelint-order'],
  rules: {
    'color-function-notation': 'legacy',
    'selector-pseudo-element-no-unknown': [
      true,
      { ignorePseudoElements: ['ng-deep'] }, // Angular 特有
    ],
    'alpha-value-notation': null,
    'annotation-no-unknown': null,
    'at-rule-empty-line-before': null,
    'color-function-alias-notation': null,
    'function-no-unknown': null,
    'media-query-no-invalid': null,
    'no-descending-specificity': null,
    'no-empty-source': null,
    'selector-class-pattern': null,
    'selector-type-no-unknown': null,
    'value-keyword-case': null,
    'scss/at-extend-no-missing-placeholder': null,
    'scss/comment-no-empty': null,
    'scss/operator-no-unspaced': null,
  },
};
