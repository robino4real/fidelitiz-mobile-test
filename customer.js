const API = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8789/api/cards' : 'https://fidelitiz-mobile-test.el-robino.chatgpt.site/api/cards';
const SESSION = '7c3c92e4-d4be-4c87-a6af-1039e8e097ba';
const CODE = 'FDZ-DEMO-CAMILLE';
const page = document.body.dataset.page;
const sync = document.getElementById('sync');
const time = document.getElementById('clock');
let firstNotifications = true;
let lastNotificationId = '';
let running = false;
function updateClock() {
  const now = new Date();
  time.textContent = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' }).format(now);
  const date = document.getElementById('date');
  if (date) date.textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
}
async function request(action) {
  const response = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: SESSION, action, code: CODE }), cache: 'no-store' });
  const result = await response.json();
  if (!result.data) throw new Error(result.error || 'Service indisponible');
  return result.data;
}
async function refresh() {
  if (running) return;
  running = true;
  try {
    if (page === 'card') {
      const { member } = await request('lookup');
      document.getElementById('points').textContent = new Intl.NumberFormat('fr-FR').format(member.points);
      document.getElementById('reward').textContent = member.rewardReady ? 'Café offert disponible' : `${member.rules.rewardThreshold} pts · Café offert`;
      sync.textContent = 'Carte synchronisée · solde actualisé automatiquement';
    } else {
      const { notifications } = await request('notifications');
      const delivered = notifications.filter((item) => item.delivered);
      const container = document.getElementById('notifications');
      container.replaceChildren();
      if (!delivered.length) {
        const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Les messages de Café Marcel apparaîtront ici.'; container.append(empty);
      }
      for (const item of delivered) {
        const card = document.createElement('a'); card.className = 'lock-notification'; card.href = './carte.html';
        const head = document.createElement('span'); head.className = 'notification-head'; head.textContent = 'Ⓜ  CAFÉ MARCEL';
        const when = document.createElement('small'); when.textContent = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' }).format(new Date(item.sendAt)); head.append(when);
        const title = document.createElement('strong'); title.textContent = item.title;
        const body = document.createElement('span'); body.textContent = item.body;
        card.append(head, title, body); container.append(card);
      }
      if (!firstNotifications && delivered[0] && delivered[0].id !== lastNotificationId) container.firstElementChild?.classList.add('new');
      firstNotifications = false; lastNotificationId = delivered[0]?.id || '';
      sync.textContent = 'Écran synchronisé automatiquement';
    }
  } catch { sync.textContent = 'Connexion interrompue · nouvelle tentative automatique'; }
  finally { running = false; }
}
updateClock(); refresh(); setInterval(updateClock, 15000); setInterval(refresh, 2000); document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
