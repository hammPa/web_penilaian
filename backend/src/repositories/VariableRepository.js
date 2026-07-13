const BaseRepository = require('./BaseRepository');

class VariableRepository extends BaseRepository {
  constructor() {
    super('variables.json');
  }

  findByCriteriaId(criteriaId) {
    const variables = this.findAll();
    return variables.filter(v => v.criteriaId === criteriaId);
  }
}

module.exports = new VariableRepository();