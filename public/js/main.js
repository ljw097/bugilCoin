async function renderAuthState() {
  const slot = document.getElementById('nav-auth-slot');
  if (!slot) return;

  try {
    const res = await fetch('/auth/me', { credentials: 'same-origin' });
    const data = await res.json();

    if (data.loggedIn) {
      slot.innerHTML = `
        <div class="user-chip">
          <span><strong>${escapeHtml(data.username)}</strong>님 환영합니다</span>
          <form class="logout-form" method="POST" action="/auth/logout">
            <button type="submit" class="btn btn-ghost">로그아웃</button>
          </form>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <a href="/login" class="btn btn-ghost">로그인</a>
        <a href="/signup" class="btn btn-primary">회원가입</a>
      `;
    }
  } catch (err) {
    slot.innerHTML = `
      <a href="/login" class="btn btn-ghost">로그인</a>
      <a href="/signup" class="btn btn-primary">회원가입</a>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', renderAuthState);
