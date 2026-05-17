const Log = require('../models/Log');

exports.logAction = async ({
  req,
  action,
  entity,
  entityId = null,
  meta = null
}) => {
  // Automatically capture IP and other request info
  const enrichedMeta = {
    ...meta,
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers?.['user-agent'] || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url
  };

  await Log.create({
    actorId: req.user?.id || null,
    actor: req.user?.email || 'system',
    action,
    entity,
    entityId,
    meta: enrichedMeta
  });
};
