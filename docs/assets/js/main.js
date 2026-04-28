import { defaultBio, templateLibrary } from "./data.js";
import {
  ensureUserScaffold,
  getAccountBundle,
  getPublicBioByUsername,
  isFirebaseConfigured,
  loginWithEmail,
  logoutUser,
  registerWithEmail,
  saveBio,
  watchAuth
} from "./firebase.js";
import {
  getShareUrl,
  mountLinkRows,
  mountPalettePicker,
  mountTemplatePicker,
  renderBioPreview,
  renderShell,
  setStatus,
  showToast,
  updateShellAuth
} from "./ui.js";

const page = document.body.dataset.page || "landing";
const protectedPages = new Set(["dashboard", "create-bio", "edit-bio", "templates", "colors", "links", "preview"]);
let authActionInFlight = "";

if (page !== "profile") {
  renderShell(page);
}
init();

function init() {
  wireStaticActions();
  announceConfig();

  watchAuth(async (user) => {
    updateShellAuth(user);
    bindLogout();

    const isRegisteringNow = page === "register" && authActionInFlight === "register";

    if (user && isFirebaseConfigured && !isRegisteringNow) {
      await ensureUserScaffold(user);
    }

    if (!user && protectedPages.has(page)) {
      window.location.href = `login.html?next=${encodeURIComponent(`${page}.html`)}`;
      return;
    }

    switch (page) {
      case "landing":
        initLanding();
        break;
      case "login":
        initLogin(user);
        break;
      case "register":
        initRegister(user);
        break;
      case "dashboard":
        initDashboard(user);
        break;
      case "create-bio":
        initCreateBio(user);
        break;
      case "edit-bio":
        initEditBio(user);
        break;
      case "templates":
        initTemplates(user);
        break;
      case "colors":
        initColors(user);
        break;
      case "links":
        initLinks(user);
        break;
      case "preview":
        initPreview(user);
        break;
      case "profile":
        initPublicProfile();
        break;
      default:
        break;
    }
  });
}

function initLanding() {
  const templateTarget = document.querySelector("[data-landing-templates]");
  const paletteTarget = document.querySelector("[data-landing-palettes]");
  const previewTarget = document.querySelector("[data-landing-preview]");

  mountTemplatePicker(templateTarget, "atlas");
  mountPalettePicker(paletteTarget, "meta-blue");
  renderBioPreview(previewTarget, {
    ...defaultBio,
    displayName: "Minh Studio",
    username: "minhstudio",
    headline: "Designer, filmmaker, and digital storyteller.",
    about: "Một bio landing page nhỏ gọn để gom toàn bộ link, portfolio, social và thông tin nổi bật của bạn vào một URL duy nhất."
  });
}

function initLogin(user) {
  if (user && authActionInFlight !== "login") {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.querySelector("#loginForm");
  const status = document.querySelector("[data-form-status]");

  if (!form) {
    return;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();

    if (!isFirebaseConfigured) {
      setStatus(status, "Firebase chưa cấu hình.", "error");
      return;
    }

    const formData = new FormData(form);

    try {
      authActionInFlight = "login";
      setStatus(status, "Đang đăng nhập...");
      await loginWithEmail({
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || "")
      });
      showToast("Đăng nhập thành công.", "success");
      window.location.href = getNextUrl() || "dashboard.html";
    } catch (error) {
      authActionInFlight = "";
      setStatus(status, normalizeError(error), "error");
    }
  };
}

function initRegister(user) {
  if (user && authActionInFlight !== "register") {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.querySelector("#registerForm");
  const status = document.querySelector("[data-form-status]");

  if (!form) {
    return;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();

    if (!isFirebaseConfigured) {
      setStatus(status, "Firebase chưa cấu hình.", "error");
      return;
    }

    const formData = new FormData(form);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setStatus(status, "Mật khẩu nhập lại chưa khớp.", "error");
      return;
    }

    try {
      authActionInFlight = "register";
      setStatus(status, "Đang tạo tài khoản...");
      await registerWithEmail({
        email: String(formData.get("email") || "").trim(),
        password,
        displayName: String(formData.get("displayName") || "").trim(),
        username: String(formData.get("username") || "").trim()
      });
      authActionInFlight = "";
      showToast("Tạo tài khoản thành công.", "success");
      window.location.href = "create-bio.html";
    } catch (error) {
      authActionInFlight = "";
      setStatus(status, normalizeError(error), "error");
    }
  };
}

async function initDashboard(user) {
  const wrapper = document.querySelector("[data-dashboard]");
  if (!wrapper || !user) {
    return;
  }

  const { userDoc, bioDoc } = await getBundle(user.uid);
  const shareUrl = bioDoc?.username ? getShareUrl(bioDoc.username) : "";
  const needsSetup = !bioDoc?.username || !bioDoc?.displayName || !bioDoc?.headline || !bioDoc?.about;

  wrapper.innerHTML = `
    <div class="dashboard-grid">
      <article class="status-card">
        <div class="status-copy">
          <h3>Trạng thái bio</h3>
          <p>${needsSetup ? "Bio của bạn chưa hoàn thiện. Hãy điền username và thông tin cơ bản trước." : "Bio đã có dữ liệu cơ bản."}</p>
        </div>
        <div class="chip-row">
          <span><i class="bx bx-user-circle"></i> ${escapeText(userDoc?.displayName || user.displayName || "Chưa có tên")}</span>
          <span><i class="bx bx-at"></i> ${escapeText(bioDoc?.username || "Chưa có username")}</span>
        </div>
      </article>
      <article class="status-card">
        <div class="status-copy">
          <h3>Link public</h3>
          <p>${shareUrl || "Hãy chọn username để tạo link public."}</p>
        </div>
        <div class="dashboard-actions">
          <button class="btn btn-primary" type="button" data-copy-share ${shareUrl ? "" : "disabled"}>Copy link</button>
          <a class="btn btn-secondary" href="${shareUrl || "#"}" target="_blank" rel="noreferrer" ${shareUrl ? "" : "aria-disabled='true'"}>Xem public</a>
        </div>
      </article>
    </div>
    ${
      needsSetup
        ? `
          <article class="setup-notice" style="margin-top: 24px;">
            <h3>Chỗ điền username và thông tin bio ở đâu?</h3>
            <p>Vào trang <strong>Tạo bio</strong> để nhập username, headline, địa điểm và phần giới thiệu. Sau đó dùng <strong>Sửa bio</strong>, <strong>Chọn mẫu</strong>, <strong>Chọn màu</strong> và <strong>Nút liên kết</strong> để hoàn thiện.</p>
            <div class="stack-actions" style="margin-top: 16px;">
              <a class="btn btn-primary" href="create-bio.html">Điền thông tin bio</a>
              <a class="btn btn-secondary" href="edit-bio.html">Sửa bio hiện có</a>
              <a class="btn btn-secondary" href="links.html">Thêm nút liên kết</a>
            </div>
          </article>
        `
        : ""
    }
  `;

  const previewTarget = document.querySelector("[data-dashboard-preview]");
  renderBioPreview(previewTarget, {
    ...defaultBio,
    ...(bioDoc || {}),
    displayName: bioDoc?.displayName || userDoc?.displayName || "Your Name"
  });

  document.querySelector("[data-copy-share]")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(shareUrl);
    showToast("Đã copy link public.", "success");
  });
}

async function initCreateBio(user) {
  const form = document.querySelector("#createBioForm");
  if (!form || !user) {
    return;
  }

  const status = document.querySelector("[data-form-status]");
  const { userDoc, bioDoc } = await getBundle(user.uid);
  hydrateBasicForm(form, {
    ...defaultBio,
    ...(userDoc || {}),
    ...(bioDoc || {}),
    displayName: bioDoc?.displayName || userDoc?.displayName || ""
  });

  form.onsubmit = async (event) => {
    event.preventDefault();
    const payload = getBasicFormPayload(form, bioDoc || {});

    try {
      setStatus(status, "Đang tạo bio...");
      await saveBio(user.uid, payload);
      showToast("Đã lưu bio cơ bản.", "success");
      window.location.href = "templates.html";
    } catch (error) {
      setStatus(status, normalizeError(error), "error");
    }
  };
}

async function initEditBio(user) {
  const form = document.querySelector("#editBioForm");
  const previewTarget = document.querySelector("[data-inline-preview]");
  if (!form || !user) {
    return;
  }

  const status = document.querySelector("[data-form-status]");
  const { bioDoc } = await getBundle(user.uid);
  const initialBio = { ...defaultBio, ...(bioDoc || {}) };

  hydrateBasicForm(form, initialBio);
  renderBioPreview(previewTarget, initialBio);

  form.oninput = () => {
    renderBioPreview(previewTarget, getBasicFormPayload(form, bioDoc || {}));
  };

  form.onsubmit = async (event) => {
    event.preventDefault();

    try {
      setStatus(status, "Đang lưu thay đổi...");
      await saveBio(user.uid, getBasicFormPayload(form, bioDoc || {}));
      showToast("Đã cập nhật bio.", "success");
    } catch (error) {
      setStatus(status, normalizeError(error), "error");
    }
  };
}

async function initTemplates(user) {
  const target = document.querySelector("[data-template-picker]");
  const status = document.querySelector("[data-form-status]");
  const summaryTarget = document.querySelector("[data-template-summary]");
  const previewTarget = document.querySelector("[data-template-live-preview]");
  const applyButton = document.querySelector("[data-apply-template]");
  const previewBadge = document.querySelector("[data-template-preview-badge]");

  if (!target || !status || !summaryTarget || !previewTarget || !applyButton || !user) {
    return;
  }

  const { userDoc, bioDoc } = await getBundle(user.uid);
  const current = {
    ...defaultBio,
    ...(bioDoc || {}),
    displayName: bioDoc?.displayName || userDoc?.displayName || user.displayName || defaultBio.displayName
  };
  let appliedTemplateId = current.templateId;
  let previewTemplateId = appliedTemplateId;

  const renderTemplateFlow = () => {
    const appliedTemplate = getTemplateMeta(appliedTemplateId);
    const previewTemplate = getTemplateMeta(previewTemplateId);
    const hasDraftChange = previewTemplateId !== appliedTemplateId;

    mountTemplatePicker(target, {
      activeId: appliedTemplateId,
      previewId: previewTemplateId,
      showState: true
    });

    renderBioPreview(previewTarget, { ...current, templateId: previewTemplateId });
    renderTemplateSummary(summaryTarget, {
      appliedTemplate,
      previewTemplate,
      hasDraftChange
    });

    if (previewBadge) {
      previewBadge.innerHTML = `<i class="bx bx-layout"></i> ${escapeText(previewTemplate.name)}`;
    }

    applyButton.disabled = !hasDraftChange;
    applyButton.innerHTML = hasDraftChange
      ? `<i class="bx bx-check-circle"></i> Áp dụng ${escapeText(previewTemplate.name)}`
      : `<i class="bx bx-check"></i> Mẫu này đang được áp dụng`;
  };

  renderTemplateFlow();
  setStatus(status, "Chọn một mẫu để xem thử trên preview. Mẫu chỉ được lưu khi bạn bấm áp dụng.");

  target.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template-id]");
    if (!button) {
      return;
    }

    previewTemplateId = button.dataset.templateId || appliedTemplateId;
    renderTemplateFlow();

    if (previewTemplateId === appliedTemplateId) {
      setStatus(status, `Bạn đang xem đúng mẫu hiện tại: ${getTemplateMeta(appliedTemplateId).name}.`, "success");
      return;
    }

    setStatus(status, `Đang xem thử ${getTemplateMeta(previewTemplateId).name}. Bấm "Áp dụng mẫu này" để lưu vào bio.`);
  });

  applyButton.addEventListener("click", async () => {
    if (previewTemplateId === appliedTemplateId) {
      return;
    }

    const nextTemplate = getTemplateMeta(previewTemplateId);

    try {
      applyButton.disabled = true;
      setStatus(status, `Đang áp dụng ${nextTemplate.name}...`);
      await saveBio(user.uid, { templateId: previewTemplateId });
      appliedTemplateId = previewTemplateId;
      current.templateId = previewTemplateId;
      renderTemplateFlow();
      showToast("Đã cập nhật mẫu bio.", "success");
      setStatus(status, `Đã áp dụng ${nextTemplate.name} vào bio của bạn.`, "success");
    } catch (error) {
      renderTemplateFlow();
      setStatus(status, normalizeError(error), "error");
    }
  });
}

async function initColors(user) {
  const target = document.querySelector("[data-palette-picker]");
  const status = document.querySelector("[data-form-status]");
  const previewTarget = document.querySelector("[data-inline-preview]");
  if (!target || !user) {
    return;
  }

  const { bioDoc } = await getBundle(user.uid);
  const current = { ...defaultBio, ...(bioDoc || {}) };
  mountPalettePicker(target, current.paletteId);
  renderBioPreview(previewTarget, current);

  target.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-palette-id]");
    if (!button) {
      return;
    }

    const paletteId = button.dataset.paletteId;

    try {
      setStatus(status, "Đang lưu bảng màu...");
      await saveBio(user.uid, { paletteId });
      mountPalettePicker(target, paletteId);
      renderBioPreview(previewTarget, { ...current, paletteId });
      showToast("Đã cập nhật màu.", "success");
      setStatus(status, "Bảng màu đã được lưu.", "success");
    } catch (error) {
      setStatus(status, normalizeError(error), "error");
    }
  });
}

async function initLinks(user) {
  const target = document.querySelector("[data-link-builder]");
  const form = document.querySelector("#linksForm");
  const status = document.querySelector("[data-form-status]");
  if (!target || !form || !user) {
    return;
  }

  const { bioDoc } = await getBundle(user.uid);
  const current = { ...defaultBio, ...(bioDoc || {}) };
  let buttons = current.buttons?.length ? [...current.buttons] : [...defaultBio.buttons];

  const sync = () => mountLinkRows(target, buttons);
  sync();

  document.querySelector("[data-add-link]")?.addEventListener("click", () => {
    buttons.push({ label: "", url: "", icon: "bx-link-alt" });
    sync();
  });

  target.addEventListener("click", (event) => {
    const removeIndex = event.target.closest("[data-remove-link]")?.dataset.removeLink;

    if (removeIndex === undefined) {
      return;
    }

    buttons.splice(Number(removeIndex), 1);
    sync();
  });

  form.onsubmit = async (event) => {
    event.preventDefault();

    buttons = collectButtons(target);

    try {
      setStatus(status, "Đang lưu các nút liên kết...");
      await saveBio(user.uid, { buttons });
      showToast("Đã cập nhật link cho bio.", "success");
      setStatus(status, "Đã lưu các nút liên kết.", "success");
      sync();
    } catch (error) {
      setStatus(status, normalizeError(error), "error");
    }
  };
}

async function initPreview(user) {
  const target = document.querySelector("[data-profile-preview]");
  const shareTarget = document.querySelector("[data-share-url]");
  const copyButton = document.querySelector("[data-copy-share]");
  if (!target || !user) {
    return;
  }

  const { bioDoc } = await getBundle(user.uid);
  const current = { ...defaultBio, ...(bioDoc || {}) };
  renderBioPreview(target, current);

  if (shareTarget) {
    shareTarget.textContent = current.username ? getShareUrl(current.username) : "Chưa có username để tạo link public.";
  }

  const publicLink = document.querySelector("[data-open-public]");
  if (publicLink) {
    publicLink.href = current.username ? getShareUrl(current.username) : "profile.html";
  }

  copyButton?.addEventListener("click", async () => {
    if (!current.username) {
      showToast("Bạn cần username trước khi share.", "error");
      return;
    }

    await navigator.clipboard.writeText(getShareUrl(current.username));
    showToast("Đã copy link public.", "success");
  });
}

async function initPublicProfile() {
  const target = document.querySelector("[data-public-profile]");
  const empty = document.querySelector("[data-public-empty]");
  if (!target) {
    return;
  }

  const username = new URLSearchParams(window.location.search).get("user") || "";

  if (!username) {
    if (empty) {
      empty.hidden = false;
    }
    return;
  }

  if (!isFirebaseConfigured) {
    target.innerHTML = `<div class="setup-notice"><h3>Firebase chưa cấu hình</h3><p>Trang public cần dữ liệu Firestore. Hãy cập nhật \`assets/js/firebase-config.js\` trước.</p></div>`;
    return;
  }

  try {
    const bio = await getPublicBioByUsername(username);

    if (!bio || bio.visibility === "private") {
      if (empty) {
        empty.hidden = false;
      }
      return;
    }

    renderBioPreview(target, { ...defaultBio, ...bio });
    document.title = `${bio.displayName || bio.username} | CreateBio`;
  } catch (error) {
    target.innerHTML = `<div class="setup-notice"><h3>Không thể tải bio</h3><p>${escapeText(normalizeError(error))}</p></div>`;
  }
}

function wireStaticActions() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.getAttribute("data-scroll-target"));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function bindLogout() {
  document.querySelectorAll("[data-logout-button]").forEach((button) => {
    button.onclick = async () => {
      try {
        await logoutUser();
        showToast("Đã đăng xuất.", "success");
        window.location.href = "index.html";
      } catch (error) {
        showToast(normalizeError(error), "error");
      }
    };
  });
}

function announceConfig() {
  document.querySelectorAll("[data-config-notice]").forEach((node) => {
    node.hidden = isFirebaseConfigured;
  });
}

async function getBundle(uid) {
  if (!isFirebaseConfigured) {
    return { userDoc: null, bioDoc: null };
  }

  return getAccountBundle(uid);
}

function hydrateBasicForm(form, bio) {
  setValue(form, "displayName", bio.displayName || "");
  setValue(form, "username", bio.username || "");
  setValue(form, "headline", bio.headline || "");
  setValue(form, "location", bio.location || "");
  setValue(form, "about", bio.about || "");
  setValue(form, "visibility", bio.visibility || "public");
}

function getBasicFormPayload(form, existingBio = {}) {
  return {
    ...existingBio,
    displayName: getText(form, "displayName"),
    username: getText(form, "username"),
    headline: getText(form, "headline"),
    location: getText(form, "location"),
    about: getText(form, "about"),
    visibility: getText(form, "visibility") || "public"
  };
}

function collectButtons(target) {
  return [...target.querySelectorAll("[data-button-row]")]
    .map((row) => ({
      label: row.querySelector('[name="buttonLabel"]')?.value.trim() || "",
      url: row.querySelector('[name="buttonUrl"]')?.value.trim() || "",
      icon: row.querySelector('[name="buttonIcon"]')?.value || "bx-link-alt"
    }))
    .filter((button) => button.label && button.url);
}

function setValue(form, name, value) {
  const input = form.elements.namedItem(name);
  if (input) {
    input.value = value;
  }
}

function getText(form, name) {
  return String(form.elements.namedItem(name)?.value || "").trim();
}

function getNextUrl() {
  return new URLSearchParams(window.location.search).get("next");
}

function normalizeError(error) {
  const message = error?.message || "Đã có lỗi xảy ra.";
  return message.replace("Firebase:", "").trim();
}

function renderTemplateSummary(target, state) {
  if (!target) {
    return;
  }

  const { appliedTemplate, previewTemplate, hasDraftChange } = state;
  target.innerHTML = `
    <article class="template-state-card">
      <span class="template-state-label">Mẫu đang dùng</span>
      <strong>${escapeText(appliedTemplate.name)}</strong>
      <p>${escapeText(appliedTemplate.description)}</p>
    </article>
    <article class="template-state-card ${hasDraftChange ? "pending" : "synced"}">
      <span class="template-state-label">Mẫu đang xem thử</span>
      <strong>${escapeText(previewTemplate.name)}</strong>
      <p>${hasDraftChange ? "Bạn đang xem thử một phương án khác. Chưa lưu vào bio." : "Preview đang khớp với đúng mẫu đang dùng."}</p>
    </article>
    <article class="template-state-card ${hasDraftChange ? "pending" : "synced"}">
      <span class="template-state-label">Trạng thái</span>
      <strong>${hasDraftChange ? "Chưa áp dụng" : "Đã đồng bộ"}</strong>
      <p>${hasDraftChange ? "Bấm Áp dụng mẫu này để lưu thay đổi. Nội dung bio của bạn vẫn được giữ nguyên." : "Bio của bạn đã dùng đúng mẫu hiện đang hiển thị ở preview."}</p>
    </article>
  `;
}

function getTemplateMeta(id) {
  return templateLibrary.find((item) => item.id === id) || templateLibrary[0];
}

function escapeText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
