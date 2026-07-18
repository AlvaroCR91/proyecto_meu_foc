// Best-effort: si la URL no está configurada, no hace nada (sin TODOs ni código
// comentado). En cuanto se rellene la env var correspondiente, empieza a disparar
// solo, sin tocar código.
function notifyWebhook(url, payload) {
  if (!url) return;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error('webhook n8n falló (no bloqueante):', err.message);
  });
}

module.exports = { notifyWebhook };
