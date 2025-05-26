module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['backend','frontend','ci','agent','docs','auto','agents','devops','qa','arch']],
    'type-enum': [2, 'always', ['feat','fix','chore','docs','test','ci','auto']],
    'subject-case': [0], // Disable subject case checking for auto commits
    'header-max-length': [0], // Disable header length for auto commits
  },
}; 