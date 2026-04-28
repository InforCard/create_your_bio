import { appConfig } from "./firebase-config.js";
import { linkIconOptions, paletteLibrary, templateLibrary } from "./data.js";

export function renderShell(activePage) {
  const headerTarget = document.querySelector("[data-site-header]");
  const footerTarget = document.querySelector("[data-site-footer]");

  if (headerTarget) {
    headerTarget.innerHTML = `
      <header class="site-header">
        <div class="container nav">
          <a class="brand" href="index.html">
            <span class="brand-mark"><i class="bx bx-shape-circle"></i></span>
            <span class="brand-copy">
              <span>CreateBio</span>
              <small>Meta-inspired bio builder</small>
            </span>
          </a>
          <nav class="nav-links" aria-label="Primary">
            ${navLink("index.html", "Trang chủ", activePage === "landing")}
            ${navLink("templates.html", "Mẫu bio", activePage === "templates")}
            ${navLink("colors.html", "Bảng màu", activePage === "colors")}
            ${navLink("preview.html", "Preview", activePage === "preview")}
          </nav>
          <div class="nav-actions" data-auth-actions>
            <a class="btn btn-ghost desktop-only" href="login.html">Đăng nhập</a>
            <a class="btn btn-primary desktop-only" href="register.html">Đăng ký</a>
            <button class="mobile-toggle" type="button" data-mobile-toggle aria-label="Mở menu">
              <i class="bx bx-menu-alt-right"></i>
            </button>
          </div>
        </div>
      </header>
      <div class="mobile-drawer" data-mobile-drawer>
        ${navLink("index.html", "Trang chủ", activePage === "landing")}
        ${navLink("dashboard.html", "Dashboard", activePage === "dashboard")}
        ${navLink("create-bio.html", "Tạo bio", activePage === "create-bio")}
        ${navLink("edit-bio.html", "Sửa bio", activePage === "edit-bio")}
        ${navLink("templates.html", "Chọn mẫu", activePage === "templates")}
        ${navLink("colors.html", "Chọn màu", activePage === "colors")}
        ${navLink("links.html", "Nút liên kết", activePage === "links")}
        ${navLink("preview.html", "Preview", activePage === "preview")}
        <div data-mobile-auth></div>
      </div>
    `;
  }

  if (footerTarget) {
    footerTarget.innerHTML = `
      <footer class="footer">
        <div class="container footer-shell">
          <div>
            <strong>CreateBio</strong>
            <p>11 trang HTML/CSS/JS cho GitHub Pages, lưu tài khoản và bio bằng Firebase.</p>
          </div>
          <div class="chip-row">
            <span><i class="bx bx-check-shield"></i> Firebase Auth</span>
            <span><i class="bx bx-cloud-upload"></i> Firestore</span>
            <span><i class="bx bx-link-alt"></i> Share public link</span>
          </div>
        </div>
      </footer>
    `;
  }

  bindShellEvents();
}

export function updateShellAuth(user) {
  const desktopTarget = document.querySelector("[data-auth-actions]");
  const mobileTarget = document.querySelector("[data-mobile-auth]");

  const signedOutDesktop = `
    <a class="btn btn-ghost desktop-only" href="login.html">Đăng nhập</a>
    <a class="btn btn-primary desktop-only" href="register.html">Đăng ký</a>
    <button class="mobile-toggle" type="button" data-mobile-toggle aria-label="Mở menu">
      <i class="bx bx-menu-alt-right"></i>
    </button>
  `;

  const signedInDesktop = `
    <a class="btn btn-ghost desktop-only" href="dashboard.html">Dashboard</a>
    <button class="btn btn-primary desktop-only" type="button" data-logout-button>Đăng xuất</button>
    <button class="mobile-toggle" type="button" data-mobile-toggle aria-label="Mở menu">
      <i class="bx bx-menu-alt-right"></i>
    </button>
  `;

  const signedOutMobile = `
    <a class="btn btn-ghost" href="login.html">Đăng nhập</a>
    <a class="btn btn-primary" href="register.html">Đăng ký</a>
  `;

  const signedInMobile = `
    <a class="btn btn-ghost" href="dashboard.html">Dashboard</a>
    <button class="btn btn-primary" type="button" data-logout-button>Đăng xuất</button>
  `;

  if (desktopTarget) {
    desktopTarget.innerHTML = user ? signedInDesktop : signedOutDesktop;
  }

  if (mobileTarget) {
    mobileTarget.innerHTML = user ? signedInMobile : signedOutMobile;
  }

  bindShellEvents();
}

export function mountTemplatePicker(target, options) {
  if (!target) {
    return;
  }

  const activeId = typeof options === "string" ? options : options?.activeId;
  const previewId = typeof options === "string" ? options : (options?.previewId || activeId);
  const showState = typeof options === "object" && Boolean(options?.showState);

  target.innerHTML = templateLibrary
    .map(
      (template) => `
        <button
          class="template-tile ${template.id === activeId ? "active" : ""} ${template.id === previewId ? "previewing" : ""}"
          type="button"
          data-template-id="${template.id}"
          aria-pressed="${template.id === previewId ? "true" : "false"}"
        >
          <div class="template-preview ${template.className}">
            <div class="template-preview-top">
              <span class="eyebrow">${template.eyebrow}</span>
              ${showState ? renderTemplateTileBadges(template.id, activeId, previewId) : ""}
            </div>
            <div>
              <h3>${template.name}</h3>
              <p>${template.description}</p>
            </div>
            ${
              showState
                ? `<span class="template-tile-note">${
                    template.id === activeId && template.id === previewId
                      ? "Mau nay dang duoc ap dung cho bio cua ban."
                      : template.id === activeId
                        ? "Day la mau dang dung. Ban co the chon mau khac de xem thu."
                        : template.id === previewId
                          ? "Dang xem thu tren preview ben phai. Bam ap dung de luu."
                          : "Bam de xem thu mau nay voi bio hien tai cua ban."
                  }</span>`
                : ""
            }
          </div>
        </button>
      `
    )
    .join("");
}

export function mountPalettePicker(target, selectedId) {
  if (!target) {
    return;
  }

  target.innerHTML = paletteLibrary
    .map(
      (palette) => `
        <button class="palette-tile ${palette.id === selectedId ? "active" : ""}" type="button" data-palette-id="${palette.id}">
          <div class="swatches">
            <span class="swatch" style="background:${palette.accent};"></span>
            <span class="swatch" style="background:${palette.accentSoft};"></span>
            <span class="swatch" style="background:${palette.surface};"></span>
          </div>
          <h3>${palette.name}</h3>
          <p>Màu nhấn ${palette.accent} với bề mặt ${palette.surface}.</p>
        </button>
      `
    )
    .join("");
}

export function mountLinkRows(target, buttons = []) {
  if (!target) {
    return;
  }

  target.innerHTML = buttons
    .map(
      (button, index) => `
        <div class="button-row" data-button-row>
          <div class="field">
            <label>Tên nút</label>
            <input type="text" name="buttonLabel" value="${escapeHtml(button.label || "")}" placeholder="Portfolio">
          </div>
          <div class="field">
            <label>Link</label>
            <input type="url" name="buttonUrl" value="${escapeHtml(button.url || "")}" placeholder="https://...">
          </div>
          <div class="field">
            <label>Icon</label>
            <select name="buttonIcon">
              ${linkIconOptions
                .map(
                  (option) => `
                    <option value="${option.value}" ${option.value === button.icon ? "selected" : ""}>${option.label}</option>
                  `
                )
                .join("")}
            </select>
          </div>
          <button class="btn btn-secondary" type="button" data-remove-link="${index}">
            <i class="bx bx-trash"></i>
            Xóa
          </button>
        </div>
      `
    )
    .join("");
}

export function renderBioPreview(target, bio) {
  if (!target) {
    return;
  }

  const palette = getPalette(bio.paletteId);
  const template = getTemplate(bio.templateId);
  const initials = makeInitials(bio.displayName || bio.username || "CB");
  const buttons = Array.isArray(bio.buttons) ? bio.buttons : [];

  target.innerHTML = `
    <section
      class="profile-shell template-${template.id}"
      data-template="${template.id}"
      style="--profile-accent:${palette.accent}; --profile-surface:${palette.accentSoft};"
    >
      <div class="profile-banner ${template.id}">
        <span class="eyebrow">${template.name}</span>
        <h1>${escapeHtml(bio.displayName || "Your Name")}</h1>
        <p>${escapeHtml(bio.headline || "Creator, builder, and storyteller.")}</p>
      </div>
      <div class="profile-content">
        <aside class="profile-sidebar">
          <div class="profile-avatar">${escapeHtml(initials)}</div>
          <span class="profile-badge"><i class="bx bx-check-shield"></i> ${escapeHtml(palette.name)}</span>
          <div class="meta-list">
            <div class="meta-item"><i class="bx bx-at"></i><span>@${escapeHtml(bio.username || "username")}</span></div>
            <div class="meta-item"><i class="bx bx-map"></i><span>${escapeHtml(bio.location || "Chưa cập nhật địa điểm")}</span></div>
            <div class="meta-item"><i class="bx bx-palette"></i><span>${escapeHtml(template.name)}</span></div>
          </div>
        </aside>
        <div class="profile-main">
          <div>
            <h2>${escapeHtml(bio.displayName || "Your Name")}</h2>
            <p>${escapeHtml(bio.about || "Mô tả ngắn về cá nhân, công việc và các liên kết quan trọng.")}</p>
          </div>
          <div class="button-list">
            ${
              buttons.length
                ? buttons
                    .map(
                      (button) => `
                        <a class="link-button" href="${escapeAttribute(safeUrl(button.url))}" target="_blank" rel="noreferrer">
                          <strong><i class="bx ${escapeAttribute(button.icon || "bx-link-alt")}"></i>${escapeHtml(button.label || "Link")}</strong>
                          <i class="bx bx-up-right-arrow-alt"></i>
                        </a>
                      `
                    )
                    .join("")
                : `<div class="inline-banner info">Chưa có nút liên kết nào. Hãy thêm ở trang quản lý link.</div>`
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

export function getShareUrl(username) {
  const base = appConfig.baseUrl && !appConfig.baseUrl.includes("yourusername")
    ? appConfig.baseUrl.replace(/\/$/, "")
    : window.location.origin + window.location.pathname.replace(/[^/]+$/, "").replace(/\/$/, "");
  return `${base}/profile.html?user=${encodeURIComponent(username)}`;
}

export function setStatus(target, message, type = "") {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.className = `status-line ${type}`.trim();
}

export function showToast(message, type = "") {
  let stack = document.querySelector(".toast-stack");

  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  stack.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function navLink(href, label, active) {
  return `<a href="${href}" class="${active ? "active" : ""}">${label}</a>`;
}

function renderTemplateTileBadges(templateId, activeId, previewId) {
  const badges = [];

  if (templateId === activeId) {
    badges.push(`<span class="template-badge">Dang dung</span>`);
  }

  if (templateId === previewId && templateId !== activeId) {
    badges.push(`<span class="template-badge preview">Dang xem thu</span>`);
  }

  return badges.length ? `<div class="template-badge-row">${badges.join("")}</div>` : "";
}

function bindShellEvents() {
  document.querySelectorAll("[data-mobile-toggle]").forEach((button) => {
    button.onclick = () => document.body.classList.toggle("nav-open");
  });

  document.querySelectorAll(".mobile-drawer a").forEach((link) => {
    link.onclick = () => document.body.classList.remove("nav-open");
  });
}

function getTemplate(id) {
  return templateLibrary.find((item) => item.id === id) || templateLibrary[0];
}

function getPalette(id) {
  return paletteLibrary.find((item) => item.id === id) || paletteLibrary[0];
}

function makeInitials(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function safeUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "#";
  }

  if (raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch (error) {
    return "#";
  }

  return "#";
}
