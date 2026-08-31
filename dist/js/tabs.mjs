function e(e) {
	throw Error(`[@sargadil/tabs] ${e}`);
}
//#endregion
//#region src/js/internal/config.js
function t() {
	return {
		contextID: "tabs",
		classes: {
			tabsNavContainer: ".tabs__nav",
			tabsNavList: ".tabs__nav-list",
			tabsNavButton: ".tabs__nav-btn",
			tabPanel: ".tab-panel",
			tabPanelTitle: ".tab-panel__title"
		},
		selectors: {
			tabPanelIdPrefix: "tabpanel",
			tabPanelOpen: "tab-panel--open"
		},
		options: {
			useCustomNav: !1,
			customNavTitles: [],
			initSelectedItem: 0,
			removeTabPanelTitle: !1,
			ariaLabel: "",
			orientation: "horizontal",
			activationMode: "automatic",
			swipeable: !1
		}
	};
}
function n(e, t) {
	let r = { ...e };
	for (let i in t) t.hasOwnProperty(i) && (r[i] = Array.isArray(t[i]) && Array.isArray(e[i]) ? e[i].concat(t[i]) : t[i] instanceof Object && e[i] instanceof Object ? n(e[i], t[i]) : t[i]);
	return r;
}
function r(e) {
	return n(t(), e);
}
function i(t) {
	let n = t.contextID, r = t.options;
	typeof n != "string" && !(n instanceof HTMLElement) && e(`"contextID" must be a string or an HTMLElement. Received ${typeof n}.`), r.orientation !== "horizontal" && r.orientation !== "vertical" && e(`"orientation" must be "horizontal" or "vertical". Received ${JSON.stringify(r.orientation)}.`), r.activationMode !== "automatic" && r.activationMode !== "manual" && e(`"activationMode" must be "automatic" or "manual". Received ${JSON.stringify(r.activationMode)}.`), (!Number.isInteger(r.initSelectedItem) || r.initSelectedItem < 0) && e(`"initSelectedItem" must be an integer >= 0. Received ${JSON.stringify(r.initSelectedItem)}.`);
}
function a(t, n, r, i = !1) {
	let a = t.classes, s = t.options, c = n.panelCount;
	if (c === 0 && e(`No tab panels were found. Expected at least one element matching "${a.tabPanel}".`), !i && s.initSelectedItem >= c && e(`initSelectedItem ${s.initSelectedItem} is out of range. Found ${c} tabs.`), s.useCustomNav) {
		let t = n.navButtonCount;
		t === 0 && e(`No custom navigation elements were found. Expected at least one element matching "${a.tabsNavButton}" (options.useCustomNav is true).`), t !== c && e(`Custom navigation has ${t} tab(s) but there are ${c} panel(s). The counts must match.`);
	} else {
		n.navContainerCount === 0 && e(`Tab navigation container was not found. Expected an element matching "${a.tabsNavContainer}".`);
		let t = n.titleCount;
		!(i && s.removeTabPanelTitle) && t !== c && e(`Expected ${c} tab panel title(s) matching "${a.tabPanelTitle}" (one per panel) but found ${t}. Each panel needs a title element; options.customNavTitles only overrides its displayed text.`);
	}
	o(s, c, r, i);
}
function o(t, n, r, i) {
	let a = !1;
	for (let e = 0; e < n; e++) if (!r(e)) {
		a = !0;
		break;
	}
	a || e("At least one enabled tab is required."), !i && r(t.initSelectedItem) && e(`initSelectedItem ${t.initSelectedItem} is disabled. Choose an enabled tab as the initial tab.`);
}
//#endregion
//#region src/js/internal/keyboard.js
function s(e) {
	return e.findIndex((e) => e);
}
function c(e) {
	return e.lastIndexOf(!0);
}
function l(e, t, n) {
	let r = n.length, i = e;
	do
		i = (i + t + r) % r;
	while (!n[i]);
	return i;
}
function u(e, { orientation: t, rtl: n, currentIndex: r, enabled: i }) {
	if (e === "Home") return s(i);
	if (e === "End") return c(i);
	let a = t === "vertical";
	return e === (a ? "ArrowUp" : n ? "ArrowRight" : "ArrowLeft") ? l(r, -1, i) : e === (a ? "ArrowDown" : n ? "ArrowLeft" : "ArrowRight") ? l(r, 1, i) : null;
}
//#endregion
//#region src/js/internal/dom.js
function d(e) {
	return e.disabled === !0 || e.getAttribute("aria-disabled") === "true";
}
function f(e) {
	return e.ownerDocument.defaultView.getComputedStyle(e).direction === "rtl";
}
function p(e, t) {
	if (e.useCustomNav) return d(e.navButtons[t]);
	let n = e.panels[t].querySelector(e.titleSelector);
	return n ? n.getAttribute("aria-disabled") === "true" : !1;
}
function m(e) {
	return Array.from(e).findIndex((e) => e.getAttribute("aria-selected") === "true");
}
function h(e, t) {
	return Array.from(e).findIndex((e) => e.getAttribute("aria-controls") === t.getAttribute("aria-controls"));
}
function g(e, t) {
	return e ? t.getElementById(e.getAttribute("aria-controls")) : null;
}
function _(e) {
	return e.getAttribute("data-nav-title") ?? e.innerText;
}
function v(e, t) {
	let n = {};
	for (let r in t) n[r] = e.querySelectorAll(t[r]);
	return n;
}
function y(e) {
	return e.querySelectorAll("[role = \"tab\"]");
}
function b(e, t) {
	let n = e, r = 2;
	for (; t.getElementById(n);) n = `${e}-${r}`, r++;
	return n;
}
function x(e, t, n) {
	let r = [];
	return e.forEach((e, i) => {
		e.id ||= b(`${t}-${i}`, n), r.push(e.id);
	}), r;
}
function S(e) {
	let t = e.ariaLabel ? ` aria-label="${e.ariaLabel}"` : "", n = e.vertical ? " aria-orientation=\"vertical\"" : "", r = `<div class="${e.listClass}" role="tablist"${t}${n}>`;
	for (let t = 0; t < e.panelIds.length; t++) {
		let n = e.panelIds[t] + "-tab", i = e.selectedIndex === t, a = e.disabledFlags[t] ? " disabled" : "";
		r += `<button type="button" id="${n}" class="${e.buttonClass}" role="tab" aria-selected="${i ? "true" : "false"}" aria-controls="${e.panelIds[t]}"${a}>${e.navTitles[t]}</button>`;
	}
	return r + "</div>";
}
function C(e) {
	e.tablist && (e.tablist.setAttribute("role", "tablist"), e.ariaLabel && e.tablist.setAttribute("aria-label", e.ariaLabel), e.vertical && e.tablist.setAttribute("aria-orientation", "vertical"));
	for (let t = 0; t < e.navButtons.length; t++) {
		let n = e.navButtons[t];
		n.id || n.setAttribute("id", e.panelIds[t] + "-tab"), n.tagName === "BUTTON" && !n.hasAttribute("type") && n.setAttribute("type", "button"), n.setAttribute("aria-controls", e.panelIds[t]), n.setAttribute("aria-selected", e.selectedIndex === t ? "true" : "false");
	}
}
function w(e) {
	e.panels.forEach((t, n) => {
		let r = e.selectedIndex === n;
		t.setAttribute("id", e.panelIds[n]), t.setAttribute("tabindex", "0"), t.setAttribute("role", "tabpanel"), t.hidden = !r, t.classList.toggle(e.openClass, r), e.tabButtons[n] && t.setAttribute("aria-labelledby", e.tabButtons[n].id);
	});
}
function T(e, t, n) {
	e.classList.remove(n), e.hidden = !0, t.classList.add(n), t.hidden = !1;
}
function E(e, t) {
	for (let n = 0; n < e.length; n++) e[n].tabIndex = t === n ? 0 : -1;
}
function D(e, t) {
	e.setAttribute("aria-selected", "false"), e.tabIndex = -1, t.setAttribute("aria-selected", "true"), t.tabIndex = 0, t.focus();
}
function O(e, t) {
	e.tabIndex = -1, t.tabIndex = 0, t.focus();
}
function k(e) {
	e.forEach((e) => e.remove());
}
//#endregion
//#region src/js/script.js
var A = class {
	#e = {};
	#t;
	#n = 50;
	#r = this.#x.bind(this);
	#i = this.#b.bind(this);
	#a = this.#v.bind(this);
	#o = this.#y.bind(this);
	#s = null;
	#c = [];
	#l = 0;
	#u = 0;
	#d = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#t = r(e), i(this.#t), this.#A(), this.#f(), this.#k(), this.#g(this.#t.options.initSelectedItem);
	}
	#f(e = !1) {
		a(this.#t, {
			panelCount: this.#e.tabPanel.length,
			navButtonCount: this.#e.tabsNavButton.length,
			navContainerCount: this.#e.tabsNavContainer.length,
			titleCount: this.#e.tabPanelTitle.length
		}, (e) => this.#p(e), e);
	}
	#p(e) {
		return p({
			useCustomNav: this.#t.options.useCustomNav,
			navButtons: this.#e.tabsNavButton,
			panels: this.#e.tabPanel,
			titleSelector: this.#t.classes.tabPanelTitle
		}, e);
	}
	destroy() {
		this.#m(this.#e.tabButtons, this.#e.tabPanel);
	}
	#m(e, t) {
		for (let t = 0; t < e.length; t++) e[t].removeEventListener("keydown", this.#r), e[t].removeEventListener("click", this.#i);
		t.forEach((e) => {
			e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o);
		});
	}
	refresh() {
		let e = this.#e.tabButtons, t = this.#e.tabPanel, n = this.getSelectedIndex(), r = g(e[n], this.#s.ownerDocument), i = Array.prototype.indexOf.call(e, this.#s.ownerDocument.activeElement) !== -1;
		this.#A(), this.#f(!0), this.#m(e, t), this.#k(), this.#g(this.#h(r, n)), i && this.#e.tabButtons[this.getSelectedIndex()].focus();
	}
	#h(e, t) {
		let n = this.#e.tabPanel, r = Array.prototype.indexOf.call(n, e);
		for (r === -1 && (r = Math.min(Math.max(t, 0), n.length - 1)); this.#p(r);) r = (r + 1) % n.length;
		return r;
	}
	getSelectedIndex() {
		return m(this.#e.tabButtons);
	}
	selectTab(t) {
		let n = this.#e.tabButtons, r = n[t];
		r || e(`selectTab: no tab exists at index ${t}.`), d(r) && e(`Cannot select disabled tab at index ${t}.`);
		let i = n[this.getSelectedIndex()];
		this.#C(i, r);
	}
	#g(e) {
		this.#D(e);
		let t = this.#e.tabButtons;
		E(t, e);
		for (let e = 0; e < t.length; e++) t[e].removeEventListener("keydown", this.#r), t[e].removeEventListener("click", this.#i), t[e].addEventListener("keydown", this.#r), t[e].addEventListener("click", this.#i);
		w({
			panels: this.#e.tabPanel,
			panelIds: this.#c,
			tabButtons: t,
			selectedIndex: e,
			openClass: this.#t.selectors.tabPanelOpen
		}), this.#t.options.swipeable && this.#_(), this.#t.options.removeTabPanelTitle && k(this.#e.tabPanelTitle);
	}
	#_() {
		this.#e.tabPanel.forEach((e) => {
			e.style.touchAction = "pan-y", e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o), e.addEventListener("touchstart", this.#a, { passive: !0 }), e.addEventListener("touchend", this.#o, { passive: !0 });
		});
	}
	#v(e) {
		this.#l = e.changedTouches[0].screenX, this.#u = e.changedTouches[0].screenY;
	}
	#y(e) {
		let t = e.changedTouches[0], n = t.screenX - this.#l, r = t.screenY - this.#u;
		if (Math.abs(n) < this.#n || Math.abs(n) <= Math.abs(r)) return;
		let i = this.#e.tabButtons, a = this.getSelectedIndex(), o = l(a, n < 0 ? 1 : -1, this.#S());
		this.#C(i[a], i[o]);
	}
	#b(e) {
		let t = e.currentTarget;
		if (d(t)) return;
		let n = this.#e.tabButtons;
		this.#C(n[this.getSelectedIndex()], t);
	}
	#x(e) {
		let t = e.currentTarget;
		if (d(t)) return;
		let n = this.#t.options, r = this.#e.tabButtons, i = u(e.key, {
			orientation: n.orientation,
			rtl: n.orientation === "horizontal" && f(t),
			currentIndex: h(r, t),
			enabled: this.#S()
		});
		if (i === null) return;
		let a = r[i];
		n.activationMode === "manual" ? O(t, a) : this.#C(t, a), e.stopPropagation(), e.preventDefault();
	}
	#S() {
		return Array.from(this.#e.tabButtons, (e) => !d(e));
	}
	#C(e, t) {
		if (e === t) return;
		let n = this.#e.tabButtons, r = this.#s.ownerDocument, i = Array.prototype.indexOf.call(n, e), a = Array.prototype.indexOf.call(n, t), o = g(e, r), s = g(t, r);
		if (!this.#w(i, a, e, t, o, s)) {
			this.#T(n, e);
			return;
		}
		D(e, t), T(o, s, this.#t.selectors.tabPanelOpen), this.#E(a, t, s);
	}
	#w(e, t, n, r, i, a) {
		return this.#s.dispatchEvent(new CustomEvent("tabs:beforechange", {
			bubbles: !0,
			cancelable: !0,
			detail: {
				fromIndex: e,
				toIndex: t,
				fromTab: n,
				toTab: r,
				fromPanel: i,
				toPanel: a
			}
		}));
	}
	#T(e, t) {
		let n = this.#s.ownerDocument.activeElement;
		n !== t && Array.prototype.indexOf.call(e, n) !== -1 && t.focus();
	}
	#E(e, t, n) {
		this.#s.dispatchEvent(new CustomEvent("tabs:change", {
			bubbles: !0,
			detail: {
				index: e,
				tab: t,
				panel: n
			}
		}));
	}
	#D(e) {
		let t = this.#t.options;
		if (t.useCustomNav) C({
			tablist: this.#e.tabsNavList[0],
			navButtons: this.#e.tabsNavButton,
			panelIds: this.#c,
			selectedIndex: e,
			ariaLabel: t.ariaLabel,
			vertical: t.orientation === "vertical"
		});
		else {
			let n = this.#e.tabPanel;
			this.#e.tabsNavContainer[0].innerHTML = S({
				panelIds: this.#c,
				navTitles: Array.from(n, (e, t) => this.#O(t)),
				disabledFlags: Array.from(n, (e, t) => this.#p(t)),
				selectedIndex: e,
				listClass: this.#t.classes.tabsNavList.substring(1),
				buttonClass: this.#t.classes.tabsNavButton.substring(1),
				ariaLabel: t.ariaLabel,
				vertical: t.orientation === "vertical"
			});
		}
		this.#e.tabButtons = y(this.#s);
	}
	#O(e) {
		let t = this.#e.tabPanel[e], n;
		if (this.#t.options.customNavTitles.length) n = this.#t.options.customNavTitles[e];
		else {
			let e = t.querySelector(this.#t.classes.tabPanelTitle);
			n = e ? _(e) : this.#d.get(t);
		}
		return n === void 0 && (n = ""), this.#d.set(t, n), n;
	}
	#k() {
		this.#c = x(this.#e.tabPanel, this.#t.selectors.tabPanelIdPrefix, this.#s.ownerDocument);
	}
	#A() {
		let t = this.#t.contextID, n = t instanceof HTMLElement ? t : document.getElementById(t);
		n || e(`Context element was not found. Expected an element with id "${t}".`), this.#s = n, this.#e = v(n, this.#t.classes);
	}
};
//#endregion
export { A as default };
