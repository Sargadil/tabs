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
//#region src/js/script.js
var s = class {
	#e = {};
	#t;
	#n = 50;
	#r = this.#w.bind(this);
	#i = this.#C.bind(this);
	#a = this.#x.bind(this);
	#o = this.#S.bind(this);
	#s = null;
	#c = [];
	#l = 0;
	#u = 0;
	#d = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#t = r(e), i(this.#t), this.#ee(), this.#p(), this.#Q(), this.#y(this.#t.options.initSelectedItem), this.#t.options.removeTabPanelTitle && this.#J();
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
		if (this.#t.options.useCustomNav) return this.#h(this.#e.tabsNavButton[e]);
		let t = this.#e.tabPanel[e].querySelector(this.#t.classes.tabPanelTitle);
		return t ? t.getAttribute("aria-disabled") === "true" : !1;
	}
	#h(e) {
		return e.disabled === !0 || e.getAttribute("aria-disabled") === "true";
	}
	destroy() {
		this.#g(this.#e.tabsNavBtn, this.#e.tabPanel);
	}
	#g(e, t) {
		for (let t = 0; t < e.length; t++) e[t].removeEventListener("keydown", this.#r), e[t].removeEventListener("click", this.#i);
		t.forEach((e) => {
			e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o);
		});
	}
	refresh() {
		let e = this.#e.tabsNavBtn, t = this.#e.tabPanel, n = this.getSelectedIndex(), r = this.#_(e[n]), i = Array.prototype.indexOf.call(e, this.#s.ownerDocument.activeElement) !== -1;
		this.#ee(), this.#p(!0), this.#g(e, t), this.#Q(), this.#y(this.#v(r, n)), this.#t.options.removeTabPanelTitle && this.#J(), i && this.#e.tabsNavBtn[this.getSelectedIndex()].focus();
	}
	#_(e) {
		return e ? document.getElementById(e.getAttribute("aria-controls")) : null;
	}
	#v(e, t) {
		let n = this.#e.tabPanel, r = Array.prototype.indexOf.call(n, e);
		for (r === -1 && (r = Math.min(Math.max(t, 0), n.length - 1)); this.#m(r);) r = (r + 1) % n.length;
		return r;
	}
	getSelectedIndex() {
		let e = this.#e.tabsNavBtn;
		return Array.from(e).findIndex((e) => e.getAttribute("aria-selected") === "true");
	}
	selectTab(e) {
		let t = this.#e.tabsNavBtn, n = t[e];
		n || this.#f(`selectTab: no tab exists at index ${e}.`), this.#h(n) && this.#f(`Cannot select disabled tab at index ${e}.`);
		let r = t[this.getSelectedIndex()];
		this.#F(r, n);
	}
	#y(e) {
		this.#q(e);
		let t = this.#e.tabsNavBtn;
		for (let n = 0; n < t.length; n++) t[n].tabIndex = e === n ? 0 : -1, t[n].removeEventListener("keydown", this.#r), t[n].removeEventListener("click", this.#i), t[n].addEventListener("keydown", this.#r), t[n].addEventListener("click", this.#i);
		this.#W(e), this.#t.options.swipeable && this.#b();
	}
	#b() {
		this.#e.tabPanel.forEach((e) => {
			e.style.touchAction = "pan-y", e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o), e.addEventListener("touchstart", this.#a, { passive: !0 }), e.addEventListener("touchend", this.#o, { passive: !0 });
		});
	}
	#x(e) {
		this.#l = e.changedTouches[0].screenX, this.#u = e.changedTouches[0].screenY;
	}
	#S(e) {
		let t = e.changedTouches[0], n = t.screenX - this.#l, r = t.screenY - this.#u;
		if (Math.abs(n) < this.#n || Math.abs(n) <= Math.abs(r)) return;
		let i = this.#e.tabsNavBtn, a = this.getSelectedIndex(), o = i[a], s = n < 0 ? this.#B(a, i) : this.#z(a, i);
		this.#F(o, s);
	}
	#C(e) {
		let t = e.currentTarget;
		if (this.#h(t)) return;
		let n = this.#s.querySelector("[aria-selected = \"true\"]");
		this.#F(n, t);
	}
	#w(e) {
		let t = e.currentTarget;
		if (this.#h(t)) return;
		let n = this.#t.options.orientation === "vertical", r = this.#t.options.activationMode === "manual", i = !n && this.#T(t), a = n ? "ArrowUp" : i ? "ArrowRight" : "ArrowLeft", o = n ? "ArrowDown" : i ? "ArrowLeft" : "ArrowRight", s = !1;
		switch (e.key) {
			case a:
				r ? this.#A(t) : this.#E(t), s = !0;
				break;
			case o:
				r ? this.#j(t) : this.#D(t), s = !0;
				break;
			case "Home":
				r ? this.#M(t) : this.#O(t), s = !0;
				break;
			case "End": r ? this.#N(t) : this.#k(t), s = !0;
		}
		s && (e.stopPropagation(), e.preventDefault());
	}
	#T(e) {
		return e.ownerDocument.defaultView.getComputedStyle(e).direction === "rtl";
	}
	#E(e) {
		let t = this.#e.tabsNavBtn, n = this.#K(t, e), r = this.#z(n, t);
		this.#F(e, r);
	}
	#D(e) {
		let t = this.#e.tabsNavBtn, n = this.#K(t, e), r = this.#B(n, t);
		this.#F(e, r);
	}
	#O(e) {
		let t = this.#e.tabsNavBtn, n = this.#H(t);
		this.#F(e, n);
	}
	#k(e) {
		let t = this.#e.tabsNavBtn, n = this.#U(t);
		this.#F(e, n);
	}
	#A(e) {
		let t = this.#e.tabsNavBtn, n = this.#K(t, e), r = this.#z(n, t);
		this.#P(e, r);
	}
	#j(e) {
		let t = this.#e.tabsNavBtn, n = this.#K(t, e), r = this.#B(n, t);
		this.#P(e, r);
	}
	#M(e) {
		let t = this.#e.tabsNavBtn, n = this.#H(t);
		this.#P(e, n);
	}
	#N(e) {
		let t = this.#e.tabsNavBtn, n = this.#U(t);
		this.#P(e, n);
	}
	#P(e, t) {
		e.tabIndex = -1, t.tabIndex = 0, t.focus();
	}
	#F(e, t) {
		if (e === t) return;
		let n = this.#e.tabsNavBtn, r = Array.prototype.indexOf.call(n, e), i = Array.prototype.indexOf.call(n, t), a = document.getElementById(e.getAttribute("aria-controls")), o = document.getElementById(t.getAttribute("aria-controls"));
		if (!this.#I(r, i, e, t, a, o)) {
			this.#L(n, e);
			return;
		}
		e.setAttribute("aria-selected", "false"), e.tabIndex = -1, t.setAttribute("aria-selected", "true"), t.tabIndex = 0, t.focus(), this.#G(a, o), this.#R(i, t, o);
	}
	#I(e, t, n, r, i, a) {
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
	#L(e, t) {
		let n = document.activeElement;
		n !== t && Array.prototype.indexOf.call(e, n) !== -1 && t.focus();
	}
	#R(e, t, n) {
		this.#s.dispatchEvent(new CustomEvent("tabs:change", {
			bubbles: !0,
			detail: {
				index: e,
				tab: t,
				panel: n
			}
		}));
	}
	#z(e, t) {
		return this.#V(t, e, -1);
	}
	#B(e, t) {
		return this.#V(t, e, 1);
	}
	#V(e, t, n) {
		let r = e.length, i = t;
		do
			i = (i + n + r) % r;
		while (this.#h(e[i]));
		return e[i];
	}
	#H(e) {
		return Array.from(e).find((e) => !this.#h(e));
	}
	#U(e) {
		return Array.from(e).reverse().find((e) => !this.#h(e));
	}
	#W(e) {
		let t = this.#e.tabsNavBtn, n = this.#t.selectors.tabPanelOpen;
		this.#e.tabPanel.forEach((r, i) => {
			let a = e === i;
			r.setAttribute("id", this.#c[i]), r.setAttribute("tabindex", "0"), r.setAttribute("role", "tabpanel"), r.hidden = !a, r.classList.toggle(n, a), t[i] && r.setAttribute("aria-labelledby", t[i].id);
		});
	}
	#G(e, t) {
		let n = this.#t.selectors.tabPanelOpen;
		e.classList.remove(n), e.hidden = !0, t.classList.add(n), t.hidden = !1;
	}
	#K(e, t) {
		return Array.from(e).findIndex((e) => e.getAttribute("aria-controls") === t.getAttribute("aria-controls"));
	}
	#q(e) {
		this.#t.options.useCustomNav ? this.#Z(e) : this.#e.tabsNavContainer[0].innerHTML = this.#X(e), this.#te("tabsNavBtn", this.#s.querySelectorAll("[role = \"tab\"]"));
	}
	#J() {
		this.#e.tabPanelTitle.forEach((e) => {
			e.remove();
		});
	}
	#Y(e) {
		let t = this.#e.tabPanel[e], n;
		if (this.#t.options.customNavTitles.length) n = this.#t.options.customNavTitles[e];
		else {
			let e = t.querySelector(this.#t.classes.tabPanelTitle);
			n = e ? e.getAttribute("data-nav-title") ?? e.innerText : this.#d.get(t);
		}
		return n === void 0 && (n = ""), this.#d.set(t, n), n;
	}
	#X(e) {
		let t = this.#t.classes.tabsNavList.substring(1), n = this.#t.classes.tabsNavButton.substring(1), r = this.#t.options.ariaLabel, i = `<div class="${t}" role="tablist"${r ? ` aria-label="${r}"` : ""}${this.#t.options.orientation === "vertical" ? " aria-orientation=\"vertical\"" : ""}>`;
		for (let t = 0; t < this.#e.tabPanel.length; t++) {
			let r = this.#c[t], a = r + "-tab", o = e === t, s = this.#m(t) ? " disabled" : "";
			i += `<button type="button" id="${a}" class="${n}" role="tab" aria-selected="${o ? "true" : "false"}" aria-controls="${r}"${s}>${this.#Y(t)}</button>`;
		}
		return i += "</div>", i;
	}
	#Z(e) {
		if (this.#e.tabsNavList.length > 0) {
			let e = this.#e.tabsNavList[0];
			e.setAttribute("role", "tablist"), this.#t.options.ariaLabel && e.setAttribute("aria-label", this.#t.options.ariaLabel), this.#t.options.orientation === "vertical" && e.setAttribute("aria-orientation", "vertical");
		}
		for (let t = 0; t < this.#e.tabsNavButton.length; t++) {
			let n = this.#e.tabsNavButton[t], r = this.#c[t], i = e === t;
			n.id || n.setAttribute("id", r + "-tab"), n.tagName === "BUTTON" && !n.hasAttribute("type") && n.setAttribute("type", "button"), n.setAttribute("aria-controls", r), n.setAttribute("aria-selected", i ? "true" : "false");
		}
	}
	#Q() {
		let e = this.#t.selectors.tabPanelIdPrefix, t = [];
		this.#e.tabPanel.forEach((n, r) => {
			n.id ||= this.#$(`${e}-${r}`), t.push(n.id);
		}), this.#c = t;
	}
	#$(e) {
		let t = e, n = 2;
		for (; document.getElementById(t);) t = `${e}-${n}`, n++;
		return t;
	}
	#ee() {
		let e = this.#t.classes, t = this.#t.contextID, n = t instanceof HTMLElement ? t : document.getElementById(t);
		n || this.#f(`Context element was not found. Expected an element with id "${t}".`), this.#s = n;
		for (let t in e) this.#e[t] = n.querySelectorAll(e[t]);
	}
	#te(e, t) {
		this.#e[e] = t;
	}
};
//#endregion
export { s as default };
