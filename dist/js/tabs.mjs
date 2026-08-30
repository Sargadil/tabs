function e(e) {
	throw Error(`[@sargadil/tabs] ${e}`);
}
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
	#r = this.#S.bind(this);
	#i = this.#x.bind(this);
	#a = this.#y.bind(this);
	#o = this.#b.bind(this);
	#s = null;
	#c = [];
	#l = 0;
	#u = 0;
	#d = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#t = r(e), i(this.#t), this.#M(), this.#p(), this.#j(), this.#_(this.#t.options.initSelectedItem), this.#t.options.removeTabPanelTitle && this.#k();
	}
	#f(e) {
		throw Error(`[@sargadil/tabs] ${e}`);
	}
	#p(e = !1) {
		let t = this.#e;
		a(this.#t, {
			panelCount: t.tabPanel.length,
			navButtonCount: t.tabsNavButton.length,
			navContainerCount: t.tabsNavContainer.length,
			titleCount: t.tabPanelTitle.length
		}, (e) => this.#m(e), e);
	}
	#m(e) {
		return p({
			useCustomNav: this.#t.options.useCustomNav,
			navButtons: this.#e.tabsNavButton,
			panels: this.#e.tabPanel,
			titleSelector: this.#t.classes.tabPanelTitle
		}, e);
	}
	destroy() {
		this.#h(this.#e.tabsNavBtn, this.#e.tabPanel);
	}
	#h(e, t) {
		for (let t = 0; t < e.length; t++) e[t].removeEventListener("keydown", this.#r), e[t].removeEventListener("click", this.#i);
		t.forEach((e) => {
			e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o);
		});
	}
	refresh() {
		let e = this.#e.tabsNavBtn, t = this.#e.tabPanel, n = this.getSelectedIndex(), r = g(e[n], this.#s.ownerDocument), i = Array.prototype.indexOf.call(e, this.#s.ownerDocument.activeElement) !== -1;
		this.#M(), this.#p(!0), this.#h(e, t), this.#j(), this.#_(this.#g(r, n)), this.#t.options.removeTabPanelTitle && this.#k(), i && this.#e.tabsNavBtn[this.getSelectedIndex()].focus();
	}
	#g(e, t) {
		let n = this.#e.tabPanel, r = Array.prototype.indexOf.call(n, e);
		for (r === -1 && (r = Math.min(Math.max(t, 0), n.length - 1)); this.#m(r);) r = (r + 1) % n.length;
		return r;
	}
	getSelectedIndex() {
		return m(this.#e.tabsNavBtn);
	}
	selectTab(e) {
		let t = this.#e.tabsNavBtn, n = t[e];
		n || this.#f(`selectTab: no tab exists at index ${e}.`), d(n) && this.#f(`Cannot select disabled tab at index ${e}.`);
		let r = t[this.getSelectedIndex()];
		this.#w(r, n);
	}
	#_(e) {
		this.#O(e);
		let t = this.#e.tabsNavBtn;
		E(t, e);
		for (let e = 0; e < t.length; e++) t[e].removeEventListener("keydown", this.#r), t[e].removeEventListener("click", this.#i), t[e].addEventListener("keydown", this.#r), t[e].addEventListener("click", this.#i);
		w({
			panels: this.#e.tabPanel,
			panelIds: this.#c,
			tabButtons: t,
			selectedIndex: e,
			openClass: this.#t.selectors.tabPanelOpen
		}), this.#t.options.swipeable && this.#v();
	}
	#v() {
		this.#e.tabPanel.forEach((e) => {
			e.style.touchAction = "pan-y", e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o), e.addEventListener("touchstart", this.#a, { passive: !0 }), e.addEventListener("touchend", this.#o, { passive: !0 });
		});
	}
	#y(e) {
		this.#l = e.changedTouches[0].screenX, this.#u = e.changedTouches[0].screenY;
	}
	#b(e) {
		let t = e.changedTouches[0], n = t.screenX - this.#l, r = t.screenY - this.#u;
		if (Math.abs(n) < this.#n || Math.abs(n) <= Math.abs(r)) return;
		let i = this.#e.tabsNavBtn, a = this.getSelectedIndex(), o = i[a], s = l(a, n < 0 ? 1 : -1, this.#C(i));
		this.#w(o, i[s]);
	}
	#x(e) {
		let t = e.currentTarget;
		if (d(t)) return;
		let n = this.#s.querySelector("[aria-selected = \"true\"]");
		this.#w(n, t);
	}
	#S(e) {
		let t = e.currentTarget;
		if (d(t)) return;
		let n = this.#t.options, r = this.#e.tabsNavBtn, i = u(e.key, {
			orientation: n.orientation,
			rtl: n.orientation === "horizontal" && f(t),
			currentIndex: h(r, t),
			enabled: this.#C(r)
		});
		if (i === null) return;
		let a = r[i];
		n.activationMode === "manual" ? O(t, a) : this.#w(t, a), e.stopPropagation(), e.preventDefault();
	}
	#C(e) {
		return Array.from(e, (e) => !d(e));
	}
	#w(e, t) {
		if (e === t) return;
		let n = this.#e.tabsNavBtn, r = this.#s.ownerDocument, i = Array.prototype.indexOf.call(n, e), a = Array.prototype.indexOf.call(n, t), o = g(e, r), s = g(t, r);
		if (!this.#T(i, a, e, t, o, s)) {
			this.#E(n, e);
			return;
		}
		D(e, t), T(o, s, this.#t.selectors.tabPanelOpen), this.#D(a, t, s);
	}
	#T(e, t, n, r, i, a) {
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
	#E(e, t) {
		let n = this.#s.ownerDocument.activeElement;
		n !== t && Array.prototype.indexOf.call(e, n) !== -1 && t.focus();
	}
	#D(e, t, n) {
		this.#s.dispatchEvent(new CustomEvent("tabs:change", {
			bubbles: !0,
			detail: {
				index: e,
				tab: t,
				panel: n
			}
		}));
	}
	#O(e) {
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
				navTitles: Array.from(n, (e, t) => this.#A(t)),
				disabledFlags: Array.from(n, (e, t) => this.#m(t)),
				selectedIndex: e,
				listClass: this.#t.classes.tabsNavList.substring(1),
				buttonClass: this.#t.classes.tabsNavButton.substring(1),
				ariaLabel: t.ariaLabel,
				vertical: t.orientation === "vertical"
			});
		}
		this.#e.tabsNavBtn = y(this.#s);
	}
	#k() {
		k(this.#e.tabPanelTitle);
	}
	#A(e) {
		let t = this.#e.tabPanel[e], n;
		if (this.#t.options.customNavTitles.length) n = this.#t.options.customNavTitles[e];
		else {
			let e = t.querySelector(this.#t.classes.tabPanelTitle);
			n = e ? _(e) : this.#d.get(t);
		}
		return n === void 0 && (n = ""), this.#d.set(t, n), n;
	}
	#j() {
		this.#c = x(this.#e.tabPanel, this.#t.selectors.tabPanelIdPrefix, this.#s.ownerDocument);
	}
	#M() {
		let e = this.#t.contextID, t = e instanceof HTMLElement ? e : document.getElementById(e);
		t || this.#f(`Context element was not found. Expected an element with id "${e}".`), this.#s = t, Object.assign(this.#e, v(t, this.#t.classes));
	}
};
//#endregion
export { A as default };
