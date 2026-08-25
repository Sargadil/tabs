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
			ariaLabel: ""
		}
	};
	constructor(e) {
		this.#t = this.#S(this.#t, e), this.#b(), this.#n(), this.#t.options.removeTabPanelTitle && this.#g();
	}
	#n() {
		this.#h();
		let e = this.#e.tabsNavBtn;
		for (let t = 0; t < e.length; t++) document.getElementById(e[t].getAttribute("aria-controls")), e[t].tabIndex = parseInt(this.#t.options.initSelectedItem) === t ? 0 : -1, e[t].addEventListener("keydown", this.#i.bind(this)), e[t].addEventListener("click", this.#r.bind(this));
		this.#f();
	}
	#r(e) {
		let t = e.currentTarget, n = document.querySelector(`#${this.#t.contextID} [aria-selected = "true"]`);
		this.#l(n, t);
	}
	#i(e) {
		let t = e.currentTarget, n = !1;
		switch (e.key) {
			case "ArrowLeft":
				this.#a(t), n = !0;
				break;
			case "ArrowRight":
				this.#o(t), n = !0;
				break;
			case "Home":
				this.#s(t), n = !0;
				break;
			case "End": this.#c(t), n = !0;
		}
		n && (e.stopPropagation(), e.preventDefault());
	}
	#a(e) {
		let t = this.#e.tabsNavBtn, n = this.#m(t, e), r = this.#u(n, t);
		this.#l(e, r);
	}
	#o(e) {
		let t = this.#e.tabsNavBtn, n = this.#m(t, e), r = this.#d(n, t);
		this.#l(e, r);
	}
	#s(e) {
		let t = this.#e.tabsNavBtn[0];
		this.#l(e, t);
	}
	#c(e) {
		let t = this.#e.tabsNavBtn, n = t[t.length - 1];
		this.#l(e, n);
	}
	#l(e, t) {
		let n = e.getAttribute(["aria-controls"]), r = t.getAttribute(["aria-controls"]);
		e.setAttribute("aria-selected", "false"), e.tabIndex = -1, t.setAttribute("aria-selected", "true"), t.tabIndex = 0, t.focus(), this.#p(n, r);
	}
	#u(e, t) {
		return e > 0 ? t[e - 1] : t[t.length - 1];
	}
	#d(e, t) {
		return e < t.length - 1 ? t[e + 1] : t[0];
	}
	#f() {
		if (this.#e.tabPanel.length === 0) throw Error("[tabs plugin] tab panels should exist.");
		let e = this.#e.tabsNavBtn;
		this.#e.tabPanel.forEach((t, n) => {
			let r = this.#t.selectors.tabPanelIdPrefix + "-" + n, i = this.#t.selectors.tabPanelOpen, a = this.#t.options.initSelectedItem;
			t.setAttribute("id", r), t.setAttribute("tabindex", "0"), t.setAttribute("role", "tabpanel"), e[n] && t.setAttribute("aria-labelledby", e[n].id), a === n && t.classList.add(i);
		});
	}
	#p(e, t) {
		let n = this.#t.selectors.tabPanelOpen;
		document.getElementById(e).classList.remove(n), document.getElementById(t).classList.add(n);
	}
	#m(e, t) {
		return Array.from(e).findIndex((e) => e.getAttribute("aria-controls") === t.getAttribute("aria-controls"));
	}
	#h() {
		if (this.#t.options.useCustomNav) this.#y();
		else {
			if (this.#e.tabsNavContainer.length === 0) throw Error("[tabs plugin] tabsNavContainer element should exist.");
			this.#e.tabsNavContainer[0].innerHTML = this.#v();
		}
		this.#x("tabsNavBtn", document.querySelectorAll(`#${this.#t.contextID} [role = "tab"]`));
	}
	#g() {
		this.#e.tabPanelTitle.forEach((e) => {
			e.remove();
		});
	}
	#_(e) {
		let t = "";
		return t = this.#t.options.customNavTitles.length ? this.#t.options.customNavTitles[e] : this.#e.tabPanelTitle[e].getAttribute("data-nav-title") ?? this.#e.tabPanelTitle[e].innerText, t === void 0 && (t = ""), t;
	}
	#v() {
		let e = this.#t.classes.tabsNavList.substring(1), t = this.#t.classes.tabsNavButton.substring(1), n = this.#t.options.ariaLabel, r = `<div class="${e}" role="tablist"${n ? ` aria-label="${n}"` : ""}>`;
		for (let e = 0; e < this.#e.tabPanelTitle.length; e++) {
			let n = this.#t.selectors.tabPanelIdPrefix + "-" + e, i = n + "-tab", a = parseInt(this.#t.options.initSelectedItem) === e;
			r += `<button id="${i}" class="${t}" role="tab" aria-selected="${a ? "true" : "false"}" aria-controls="${n}">${this.#_(e)}</button>`;
		}
		return r += "</div>", r;
	}
	#y() {
		if (this.#e.tabsNavList.length > 0) {
			let e = this.#e.tabsNavList[0];
			e.setAttribute("role", "tablist"), this.#t.options.ariaLabel && e.setAttribute("aria-label", this.#t.options.ariaLabel);
		}
		for (let e = 0; e < this.#e.tabsNavButton.length; e++) {
			let t = this.#e.tabsNavButton[e], n = this.#t.selectors.tabPanelIdPrefix + "-" + e, r = parseInt(this.#t.options.initSelectedItem) === e;
			t.id || t.setAttribute("id", n + "-tab"), t.setAttribute("aria-controls", n), t.setAttribute("aria-selected", "false"), r && t.setAttribute("aria-selected", "true");
		}
	}
	#b() {
		let e = this.#t.classes, t = document.getElementById(this.#t.contextID);
		if (!t) throw Error("[tabs plugin] contextID does not exist in html structure.");
		for (let n in e) this.#e[n] = t.querySelectorAll(e[n]);
	}
	#x(e, t) {
		this.#e[e] = t;
	}
	#S(e, t) {
		let n = { ...e };
		for (let r in t) t.hasOwnProperty(r) && (n[r] = Array.isArray(t[r]) && Array.isArray(e[r]) ? e[r].concat(t[r]) : t[r] instanceof Object && e[r] instanceof Object ? this.#S(e[r], t[r]) : t[r]);
		return n;
	}
};
//#endregion
export { e as default };
