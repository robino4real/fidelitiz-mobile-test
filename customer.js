const API = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8789/api/cards' : 'https://fidelitiz-mobile-test.el-robino.chatgpt.site/api/cards';
const SESSION = '7c3c92e4-d4be-4c87-a6af-1039e8e097ba';
const CODE = 'FDZ-DEMO-CAMILLE';
const page = document.body.dataset.page;
const sync = document.getElementById('sync');
const time = document.getElementById('clock');
let firstNotifications = true;
let lastNotificationId = '';
let notificationSignature = '';
let lastPoints = null;
let running = false;
function updateClock() {
  const now = new Date();
  time.textContent = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' }).format(now);
  const statusTime = document.querySelector('.status-time');
  if (statusTime) statusTime.textContent = time.textContent;
  const date = document.getElementById('date');
  if (date) {
    const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
    date.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }
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
      const points = document.getElementById('points');
      if (lastPoints !== null && member.points !== lastPoints) {
        points.parentElement.classList.remove('updated');
        void points.parentElement.offsetWidth;
        points.parentElement.classList.add('updated');
      }
      points.textContent = new Intl.NumberFormat('fr-FR').format(member.points);
      lastPoints = member.points;
      document.getElementById('reward').textContent = member.rewardReady ? 'Café offert disponible' : `${member.rules.rewardThreshold} pts · Café offert`;
      sync.textContent = 'Carte synchronisée';
    } else {
      const { notifications } = await request('notifications');
      const delivered = notifications.filter((item) => item.delivered);
      const container = document.getElementById('notifications');
      const signature = delivered.map((item) => [item.id, item.title, item.body].join('|')).join('~');
      if (signature !== notificationSignature) {
        const expanded = container.classList.contains('expanded') && delivered[0]?.id === lastNotificationId;
        container.replaceChildren();
        for (const item of delivered) {
          const card = document.createElement('a'); card.className = 'lock-notification'; card.href = './carte.html';
          const icon = document.createElement('span'); icon.className = 'notification-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = 'M';
          const content = document.createElement('span'); content.className = 'notification-content';
          const head = document.createElement('span'); head.className = 'notification-head';
          const app = document.createElement('span'); app.textContent = 'CAFÉ MARCEL';
          const when = document.createElement('small');
          const sent = new Date(item.sendAt);
          when.textContent = Date.now() - sent.getTime() < 60000 ? 'maintenant' : new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: '2-digit' }).format(sent);
          head.append(app, when);
          const title = document.createElement('strong'); title.textContent = item.title;
          const body = document.createElement('span'); body.className = 'notification-body'; body.textContent = item.body;
          content.append(head, title, body); card.append(icon, content); container.append(card);
        }
        if (delivered.length > 1) {
          const more = document.createElement('button');
          more.type = 'button';
          more.className = 'notification-expand';
          const label = () => more.textContent = container.classList.contains('expanded') ? 'Réduire les notifications' : `${delivered.length - 1} autre${delivered.length > 2 ? 's' : ''} notification${delivered.length > 2 ? 's' : ''}`;
          more.addEventListener('click', () => { container.classList.toggle('expanded'); more.setAttribute('aria-expanded', String(container.classList.contains('expanded'))); label(); });
          container.insertBefore(more, container.children[1] || null);
          container.classList.toggle('expanded', expanded);
          more.setAttribute('aria-expanded', String(expanded));
          label();
        } else container.classList.remove('expanded');
        if (!firstNotifications && delivered[0] && delivered[0].id !== lastNotificationId) container.firstElementChild?.classList.add('new');
        notificationSignature = signature;
      }
      firstNotifications = false; lastNotificationId = delivered[0]?.id || '';
      sync.textContent = 'Notifications synchronisées';
    }
  } catch { sync.textContent = 'Connexion interrompue · nouvelle tentative automatique'; }
  finally { running = false; }
}
async function start() {
  updateClock();
  if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
    sync.textContent = 'Réinitialisation de la démo…';
    try { await request('resetActivity'); }
    catch {
      sync.textContent = 'Réinitialisation impossible. Rechargez la page.';
      sync.classList.remove('sr-only');
      sync.classList.add('sync-error');
      return;
    }
  }
  await refresh();
  setInterval(updateClock, 15000);
  setInterval(refresh, 2000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}
void start();
