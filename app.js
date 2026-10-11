(function () {
  const STORAGE_KEY = "xhs-sop-course-v2";
  const STEP_IDS = ["home", "s1", "s2", "s3", "s4", "s5"];
  const STEP_LABELS = {
    home: "总览",
    s1: "1 / 5 定位",
    s2: "2 / 5 对标",
    s3: "3 / 5 矩阵获客",
    s4: "4 / 5 矩阵基建",
    s5: "5 / 5 引流",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let currentId = "home";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function collectFields() {
    const data = load();
    $$("[data-field]").forEach((el) => {
      const key = el.getAttribute("data-field");
      if (el.type === "checkbox") data[key] = el.checked;
      else data[key] = el.value;
    });
    return data;
  }

  function applyFields(data) {
    $$("[data-field]").forEach((el) => {
      const key = el.getAttribute("data-field");
      if (!(key in data)) return;
      if (el.type === "checkbox") {
        el.checked = !!data[key];
        el.closest(".check-item")?.classList.toggle("checked", el.checked);
      } else {
        el.value = data[key] ?? "";
      }
    });
  }

  function stepDone(step) {
    const data = load();
    const map = {
      s1: ["s1_task", "s1_pos", "s1_list1", "s1_list2", "s1_list3"],
      s2: ["s2_who", "s2_stuck", "s2_offer"],
      s3: ["s3_role1", "s3_who1", "s3_q1"],
      s4: ["s4_card_who", "s4_card_q", "s4_card_next"],
      s5: ["s5_selfcheck", "s5_d1_scene"],
    };
    const keys = map[step] || [];
    return keys.some((k) => {
      const v = data[k];
      return typeof v === "string" ? v.trim().length > 0 : !!v;
    });
  }

  function updateProgress() {
    const doneCount = ["s1", "s2", "s3", "s4", "s5"].filter(stepDone).length;
    const pct = (doneCount / 5) * 100;
    const fill = $("#progressFill");
    const label = $("#progressLabel");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = `${doneCount} / 5 步已有填写`;

    ["s1", "s2", "s3", "s4", "s5"].forEach((id) => {
      const link = $(`.side-link[data-nav="${id}"]`);
      const card = $(`.step-card[data-nav="${id}"]`);
      const done = stepDone(id);
      link?.classList.toggle("done", done);
      const st = card?.querySelector(".sc-status");
      if (st) {
        st.textContent = done ? "已填写" : "未开始";
        st.classList.toggle("done", done);
      }
    });
  }

  function updateRail() {
    const label = $("#railLabel");
    if (label) label.textContent = STEP_LABELS[currentId] || currentId;
  }

  function showView(id) {
    if (!STEP_IDS.includes(id)) id = "home";
    currentId = id;
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + id));
    $$(".side-link").forEach((l) =>
      l.classList.toggle("active", l.getAttribute("data-nav") === id)
    );
    history.replaceState(null, "", "#" + id);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    closeMenu();
    updateRail();
  }

  function stepDelta(delta) {
    const idx = STEP_IDS.indexOf(currentId);
    const next = STEP_IDS[Math.max(0, Math.min(STEP_IDS.length - 1, idx + delta))];
    if (next !== currentId) showView(next);
  }

  function openMenu() {
    $("#sidebar")?.classList.add("open");
    $("#backdrop")?.classList.add("show");
  }
  function closeMenu() {
    $("#sidebar")?.classList.remove("open");
    $("#backdrop")?.classList.remove("show");
  }

  function persist() {
    const data = collectFields();
    save(data);
    updateProgress();
  }

  function clearAll() {
    if (!confirm("确定清空本站所有已填内容？此操作不可恢复。")) return;
    localStorage.removeItem(STORAGE_KEY);
    $$("[data-field]").forEach((el) => {
      if (el.type === "checkbox") {
        el.checked = false;
        el.closest(".check-item")?.classList.remove("checked");
      } else el.value = "";
    });
    updateProgress();
    toast("已清空本地填写");
  }

  function exportJson() {
    const data = collectFields();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "xhs-sop-fills.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("已导出 JSON");
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function toggleNotes() {
    document.body.classList.toggle("notes-on");
    const on = document.body.classList.contains("notes-on");
    $("#btnNotes")?.classList.toggle("on", on);
    localStorage.setItem("xhs-sop-notes", on ? "1" : "0");
    toast(on ? "讲者提示已开" : "讲者提示已关");
  }

  function toggleLarge() {
    document.body.classList.toggle("large-type");
    const on = document.body.classList.contains("large-type");
    $("#btnLarge")?.classList.toggle("on", on);
    localStorage.setItem("xhs-sop-large", on ? "1" : "0");
    toast(on ? "大字模式已开" : "大字模式已关");
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyFields(load());
    updateProgress();

    if (localStorage.getItem("xhs-sop-notes") === "1") {
      document.body.classList.add("notes-on");
      $("#btnNotes")?.classList.add("on");
    }
    if (localStorage.getItem("xhs-sop-large") === "1") {
      document.body.classList.add("large-type");
      $("#btnLarge")?.classList.add("on");
    }

    const hash = (location.hash || "#home").slice(1);
    showView(STEP_IDS.includes(hash) ? hash : "home");

    document.body.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) {
        e.preventDefault();
        showView(nav.getAttribute("data-nav"));
      }
    });

    document.body.addEventListener("input", (e) => {
      if (e.target.matches("[data-field]")) {
        if (e.target.type === "checkbox") {
          e.target.closest(".check-item")?.classList.toggle("checked", e.target.checked);
        }
        persist();
      }
    });
    document.body.addEventListener("change", (e) => {
      if (e.target.matches("[data-field]")) persist();
    });

    $("#btnSave")?.addEventListener("click", () => {
      persist();
      toast("已保存到本机浏览器");
    });
    $("#btnClear")?.addEventListener("click", clearAll);
    $("#btnExport")?.addEventListener("click", exportJson);
    $("#btnMenu")?.addEventListener("click", openMenu);
    $("#backdrop")?.addEventListener("click", closeMenu);
    $("#btnNotes")?.addEventListener("click", toggleNotes);
    $("#btnLarge")?.addEventListener("click", toggleLarge);
    $("#btnPrev")?.addEventListener("click", () => stepDelta(-1));
    $("#btnNext")?.addEventListener("click", () => stepDelta(1));

    document.addEventListener("keydown", (e) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight" || e.key === "n" || e.key === "N" || e.key === "PageDown") {
        e.preventDefault();
        stepDelta(1);
      } else if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P" || e.key === "PageUp") {
        e.preventDefault();
        stepDelta(-1);
      } else if (e.key === "t" || e.key === "T") {
        toggleNotes();
      } else if (e.key === "l" || e.key === "L") {
        toggleLarge();
      }
    });

    let saveTimer;
    document.body.addEventListener("input", (e) => {
      if (!e.target.matches("[data-field]")) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => toast("自动已保存"), 900);
    });
  });
})();
