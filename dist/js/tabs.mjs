//#region src/js/script.js
var e = class {
	#e = {};
	#t = {
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
	#n = 50;
	#r = this.#E.bind(this);
	#i = this.#T.bind(this);
	#a = this.#C.bind(this);
	#o = this.#w.bind(this);
	#s = null;
	#c = [];
	#l = 0;
	#u = 0;
	#d = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#t = this.#ie(this.#t, e), this.#p(), this.#ne(), this.#m(), this.#ee(), this.#x(this.#t.options.initSelectedItem), this.#t.options.removeTabPanelTitle && this.#X();
	}
	#f(e) {
		throw Error(`[@sargadil/tabs] ${e}`);
	}
	#p() {
		let e = this.#t.contextID, t = this.#t.options;
		typeof e != "string" && !(e instanceof HTMLElement) && this.#f(`"contextID" must be a string or an HTMLElement. Received ${typeof e}.`), t.orientation !== "horizontal" && t.orientation !== "vertical" && this.#f(`"orientation" must be "horizontal" or "vertical". Received ${JSON.stringify(t.orientation)}.`), t.activationMode !== "automatic" && t.activationMode !== "manual" && this.#f(`"activationMode" must be "automatic" or "manual". Received ${JSON.stringify(t.activationMode)}.`), (!Number.isInteger(t.initSelectedItem) || t.initSelectedItem < 0) && this.#f(`"initSelectedItem" must be an integer >= 0. Received ${JSON.stringify(t.initSelectedItem)}.`);
	}
	#m(e = !1) {
		let t = this.#t.classes, n = this.#t.options, r = this.#e.tabPanel.length;
		if (r === 0 && this.#f(`No tab panels were found. Expected at least one element matching "${t.tabPanel}".`), !e && n.initSelectedItem >= r && this.#f(`initSelectedItem ${n.initSelectedItem} is out of range. Found ${r} tabs.`), n.useCustomNav) {
			let e = this.#e.tabsNavButton.length;
			e === 0 && this.#f(`No custom navigation elements were found. Expected at least one element matching "${t.tabsNavButton}" (options.useCustomNav is true).`), e !== r && this.#f(`Custom navigation has ${e} tab(s) but there are ${r} panel(s). The counts must match.`);
		} else {
			this.#e.tabsNavContainer.length === 0 && this.#f(`Tab navigation container was not found. Expected an element matching "${t.tabsNavContainer}".`);
			let i = this.#e.tabPanelTitle.length;
			!(e && n.removeTabPanelTitle) && i !== r && this.#f(`Expected ${r} tab panel title(s) matching "${t.tabPanelTitle}" (one per panel) but found ${i}. Each panel needs a title element; options.customNavTitles only overrides its displayed text.`);
		}
		this.#h(r, e);
	}
	#h(e, t = !1) {
		let n = this.#t.options, r = !1;
		for (let t = 0; t < e; t++) if (!this.#g(t)) {
			r = !0;
			break;
		}
		r || this.#f("At least one enabled tab is required."), !t && this.#g(n.initSelectedItem) && this.#f(`initSelectedItem ${n.initSelectedItem} is disabled. Choose an enabled tab as the initial tab.`);
	}
	#g(e) {
		if (this.#t.options.useCustomNav) return this.#_(this.#e.tabsNavButton[e]);
		let t = this.#e.tabPanel[e].querySelector(this.#t.classes.tabPanelTitle);
		return t ? t.getAttribute("aria-disabled") === "true" : !1;
	}
	#_(e) {
		return e.disabled === !0 || e.getAttribute("aria-disabled") === "true";
	}
	destroy() {
		this.#v(this.#e.tabsNavBtn, this.#e.tabPanel);
	}
	#v(e, t) {
		for (let t = 0; t < e.length; t++) e[t].removeEventListener("keydown", this.#r), e[t].removeEventListener("click", this.#i);
		t.forEach((e) => {
			e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o);
		});
	}
	refresh() {
		let e = this.#e.tabsNavBtn, t = this.#e.tabPanel, n = this.getSelectedIndex(), r = this.#y(e[n]), i = Array.prototype.indexOf.call(e, this.#s.ownerDocument.activeElement) !== -1;
		this.#ne(), this.#m(!0), this.#v(e, t), this.#ee(), this.#x(this.#b(r, n)), this.#t.options.removeTabPanelTitle && this.#X(), i && this.#e.tabsNavBtn[this.getSelectedIndex()].focus();
	}
	#y(e) {
		return e ? document.getElementById(e.getAttribute("aria-controls")) : null;
	}
	#b(e, t) {
		let n = this.#e.tabPanel, r = Array.prototype.indexOf.call(n, e);
		for (r === -1 && (r = Math.min(Math.max(t, 0), n.length - 1)); this.#g(r);) r = (r + 1) % n.length;
		return r;
	}
	getSelectedIndex() {
		let e = this.#e.tabsNavBtn;
		return Array.from(e).findIndex((e) => e.getAttribute("aria-selected") === "true");
	}
	selectTab(e) {
		let t = this.#e.tabsNavBtn, n = t[e];
		n || this.#f(`selectTab: no tab exists at index ${e}.`), this.#_(n) && this.#f(`Cannot select disabled tab at index ${e}.`);
		let r = t[this.getSelectedIndex()];
		this.#L(r, n);
	}
	#x(e) {
		this.#Y(e);
		let t = this.#e.tabsNavBtn;
		for (let n = 0; n < t.length; n++) t[n].tabIndex = e === n ? 0 : -1, t[n].removeEventListener("keydown", this.#r), t[n].removeEventListener("click", this.#i), t[n].addEventListener("keydown", this.#r), t[n].addEventListener("click", this.#i);
		this.#K(e), this.#t.options.swipeable && this.#S();
	}
	#S() {
		this.#e.tabPanel.forEach((e) => {
			e.style.touchAction = "pan-y", e.removeEventListener("touchstart", this.#a), e.removeEventListener("touchend", this.#o), e.addEventListener("touchstart", this.#a, { passive: !0 }), e.addEventListener("touchend", this.#o, { passive: !0 });
		});
	}
	#C(e) {
		this.#l = e.changedTouches[0].screenX, this.#u = e.changedTouches[0].screenY;
	}
	#w(e) {
		let t = e.changedTouches[0], n = t.screenX - this.#l, r = t.screenY - this.#u;
		if (Math.abs(n) < this.#n || Math.abs(n) <= Math.abs(r)) return;
		let i = this.#e.tabsNavBtn, a = this.getSelectedIndex(), o = i[a], s = n < 0 ? this.#H(a, i) : this.#V(a, i);
		this.#L(o, s);
	}
	#T(e) {
		let t = e.currentTarget;
		if (this.#_(t)) return;
		let n = this.#s.querySelector("[aria-selected = \"true\"]");
		this.#L(n, t);
	}
	#E(e) {
		let t = e.currentTarget;
		if (this.#_(t)) return;
		let n = this.#t.options.orientation === "vertical", r = this.#t.options.activationMode === "manual", i = !n && this.#D(t), a = n ? "ArrowUp" : i ? "ArrowRight" : "ArrowLeft", o = n ? "ArrowDown" : i ? "ArrowLeft" : "ArrowRight", s = !1;
		switch (e.key) {
			case a:
				r ? this.#M(t) : this.#O(t), s = !0;
				break;
			case o:
				r ? this.#N(t) : this.#k(t), s = !0;
				break;
			case "Home":
				r ? this.#P(t) : this.#A(t), s = !0;
				break;
			case "End": r ? this.#F(t) : this.#j(t), s = !0;
		}
		s && (e.stopPropagation(), e.preventDefault());
	}
	#D(e) {
		return e.ownerDocument.defaultView.getComputedStyle(e).direction === "rtl";
	}
	#O(e) {
		let t = this.#e.tabsNavBtn, n = this.#J(t, e), r = this.#V(n, t);
		this.#L(e, r);
	}
	#k(e) {
		let t = this.#e.tabsNavBtn, n = this.#J(t, e), r = this.#H(n, t);
		this.#L(e, r);
	}
	#A(e) {
		let t = this.#e.tabsNavBtn, n = this.#W(t);
		this.#L(e, n);
	}
	#j(e) {
		let t = this.#e.tabsNavBtn, n = this.#G(t);
		this.#L(e, n);
	}
	#M(e) {
		let t = this.#e.tabsNavBtn, n = this.#J(t, e), r = this.#V(n, t);
		this.#I(e, r);
	}
	#N(e) {
		let t = this.#e.tabsNavBtn, n = this.#J(t, e), r = this.#H(n, t);
		this.#I(e, r);
	}
	#P(e) {
		let t = this.#e.tabsNavBtn, n = this.#W(t);
		this.#I(e, n);
	}
	#F(e) {
		let t = this.#e.tabsNavBtn, n = this.#G(t);
		this.#I(e, n);
	}
	#I(e, t) {
		e.tabIndex = -1, t.tabIndex = 0, t.focus();
	}
	#L(e, t) {
		if (e === t) return;
		let n = this.#e.tabsNavBtn, r = Array.prototype.indexOf.call(n, e), i = Array.prototype.indexOf.call(n, t), a = document.getElementById(e.getAttribute("aria-controls")), o = document.getElementById(t.getAttribute("aria-controls"));
		if (!this.#R(r, i, e, t, a, o)) {
			this.#z(n, e);
			return;
		}
		e.setAttribute("aria-selected", "false"), e.tabIndex = -1, t.setAttribute("aria-selected", "true"), t.tabIndex = 0, t.focus(), this.#q(a, o), this.#B(i, t, o);
	}
	#R(e, t, n, r, i, a) {
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
	#z(e, t) {
		let n = document.activeElement;
		n !== t && Array.prototype.indexOf.call(e, n) !== -1 && t.focus();
	}
	#B(e, t, n) {
		this.#s.dispatchEvent(new CustomEvent("tabs:change", {
			bubbles: !0,
			detail: {
				index: e,
				tab: t,
				panel: n
			}
		}));
	}
	#V(e, t) {
		return this.#U(t, e, -1);
	}
	#H(e, t) {
		return this.#U(t, e, 1);
	}
	#U(e, t, n) {
		let r = e.length, i = t;
		do
			i = (i + n + r) % r;
		while (this.#_(e[i]));
		return e[i];
	}
	#W(e) {
		return Array.from(e).find((e) => !this.#_(e));
	}
	#G(e) {
		return Array.from(e).reverse().find((e) => !this.#_(e));
	}
	#K(e) {
		let t = this.#e.tabsNavBtn, n = this.#t.selectors.tabPanelOpen;
		this.#e.tabPanel.forEach((r, i) => {
			let a = e === i;
			r.setAttribute("id", this.#c[i]), r.setAttribute("tabindex", "0"), r.setAttribute("role", "tabpanel"), r.hidden = !a, r.classList.toggle(n, a), t[i] && r.setAttribute("aria-labelledby", t[i].id);
		});
	}
	#q(e, t) {
		let n = this.#t.selectors.tabPanelOpen;
		e.classList.remove(n), e.hidden = !0, t.classList.add(n), t.hidden = !1;
	}
	#J(e, t) {
		return Array.from(e).findIndex((e) => e.getAttribute("aria-controls") === t.getAttribute("aria-controls"));
	}
	#Y(e) {
		this.#t.options.useCustomNav ? this.#$(e) : this.#e.tabsNavContainer[0].innerHTML = this.#Q(e), this.#re("tabsNavBtn", this.#s.querySelectorAll("[role = \"tab\"]"));
	}
	#X() {
		this.#e.tabPanelTitle.forEach((e) => {
			e.remove();
		});
	}
	#Z(e) {
		let t = this.#e.tabPanel[e], n;
		if (this.#t.options.customNavTitles.length) n = this.#t.options.customNavTitles[e];
		else {
			let e = t.querySelector(this.#t.classes.tabPanelTitle);
			n = e ? e.getAttribute("data-nav-title") ?? e.innerText : this.#d.get(t);
		}
		return n === void 0 && (n = ""), this.#d.set(t, n), n;
	}
	#Q(e) {
		let t = this.#t.classes.tabsNavList.substring(1), n = this.#t.classes.tabsNavButton.substring(1), r = this.#t.options.ariaLabel, i = `<div class="${t}" role="tablist"${r ? ` aria-label="${r}"` : ""}${this.#t.options.orientation === "vertical" ? " aria-orientation=\"vertical\"" : ""}>`;
		for (let t = 0; t < this.#e.tabPanel.length; t++) {
			let r = this.#c[t], a = r + "-tab", o = e === t, s = this.#g(t) ? " disabled" : "";
			i += `<button type="button" id="${a}" class="${n}" role="tab" aria-selected="${o ? "true" : "false"}" aria-controls="${r}"${s}>${this.#Z(t)}</button>`;
		}
		return i += "</div>", i;
	}
	#$(e) {
		if (this.#e.tabsNavList.length > 0) {
			let e = this.#e.tabsNavList[0];
			e.setAttribute("role", "tablist"), this.#t.options.ariaLabel && e.setAttribute("aria-label", this.#t.options.ariaLabel), this.#t.options.orientation === "vertical" && e.setAttribute("aria-orientation", "vertical");
		}
		for (let t = 0; t < this.#e.tabsNavButton.length; t++) {
			let n = this.#e.tabsNavButton[t], r = this.#c[t], i = e === t;
			n.id || n.setAttribute("id", r + "-tab"), n.tagName === "BUTTON" && !n.hasAttribute("type") && n.setAttribute("type", "button"), n.setAttribute("aria-controls", r), n.setAttribute("aria-selected", i ? "true" : "false");
		}
	}
	#ee() {
		let e = this.#t.selectors.tabPanelIdPrefix, t = [];
		this.#e.tabPanel.forEach((n, r) => {
			n.id ||= this.#te(`${e}-${r}`), t.push(n.id);
		}), this.#c = t;
	}
	#te(e) {
		let t = e, n = 2;
		for (; document.getElementById(t);) t = `${e}-${n}`, n++;
		return t;
	}
	#ne() {
		let e = this.#t.classes, t = this.#t.contextID, n = t instanceof HTMLElement ? t : document.getElementById(t);
		n || this.#f(`Context element was not found. Expected an element with id "${t}".`), this.#s = n;
		for (let t in e) this.#e[t] = n.querySelectorAll(e[t]);
	}
	#re(e, t) {
		this.#e[e] = t;
	}
	#ie(e, t) {
		let n = { ...e };
		for (let r in t) t.hasOwnProperty(r) && (n[r] = Array.isArray(t[r]) && Array.isArray(e[r]) ? e[r].concat(t[r]) : t[r] instanceof Object && e[r] instanceof Object ? this.#ie(e[r], t[r]) : t[r]);
		return n;
	}
};
//#endregion
export { e as default };
