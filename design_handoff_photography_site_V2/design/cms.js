// Shared local CMS shim: admin auth + editable text/image store.
// Prototype-only persistence (localStorage, this browser). Real cross-device
// sync needs a backend — flagged for the eventual Claude Code handoff.
(function () {
  var ADMIN_KEY = "jd_admin_authed_v1";
  var TEXT_KEY = "jd_cms_text_v1";
  var IMG_KEY = "jd_cms_img_v1";
  var DEFAULT_PW = "lamplight";

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { return {}; }
  }
  function writeJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }

  window.JDCms = {
    isAdmin: function () { return localStorage.getItem(ADMIN_KEY) === "1"; },
    login: function (pw, expected) {
      if ((pw || "").trim() === (expected || DEFAULT_PW)) {
        localStorage.setItem(ADMIN_KEY, "1");
        return true;
      }
      return false;
    },
    logout: function () { localStorage.removeItem(ADMIN_KEY); },
    text: function (id, fallback) {
      var m = readJSON(TEXT_KEY);
      return (m[id] !== undefined && m[id] !== "") ? m[id] : fallback;
    },
    setText: function (id, val) {
      var m = readJSON(TEXT_KEY);
      m[id] = val;
      writeJSON(TEXT_KEY, m);
    },
    image: function (id, fallback) {
      var m = readJSON(IMG_KEY);
      return m[id] || fallback;
    },
    setImage: function (id, dataUrl) {
      var m = readJSON(IMG_KEY);
      m[id] = dataUrl;
      writeJSON(IMG_KEY, m);
    }
  };
})();
