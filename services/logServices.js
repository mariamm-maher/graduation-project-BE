const Log = require('../models/Log');

exports.logAction = async ({
  req,
  action,
  entity,
  entityId = null,
  meta = null
}) => {
  await Log.create({
    actorId: req.user?.id || null,
    actor: req.user?.email || 'system',
    action,
    entity,
    entityId,
    meta
  });
};
