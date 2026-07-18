const router = require('express').Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'eventos-api', uptime: process.uptime() });
});

module.exports = router;
