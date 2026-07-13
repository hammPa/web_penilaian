const BaseRepository = require('./BaseRepository');

class AssessmentRepository extends BaseRepository {
  constructor() {
    super('assessments.json');
  }

  findByUserId(userId) {
    const assessments = this.findAll();
    return assessments.filter(a => a.userId === userId);
  }
}

module.exports = new AssessmentRepository();