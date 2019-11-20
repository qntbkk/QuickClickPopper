define([
  "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-class",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on",
    "dojo/date/locale",
  "dojo/text!QuickClickPopper/widget/template/QuickClickPopper.html"
], function(declare, _WidgetBase, _TemplatedMixin, dojoClass, dojoLang, dojoQuery, on, locale, widgetTemplate) {
  "use strict";
  // var $ = _jQuery.noConflict(true);
  return declare("QuickClickPopper.widget.QuickClickPopper", [_WidgetBase, _TemplatedMixin], {
    // _TemplatedMixin will create our dom node using this HTML template.
    templateString: widgetTemplate,
    // DOM elements
    canvas: null,
    // Parameters configured in the Modeler.
    messageString: "",
    // Internal variables. Non-primitives created in the prototype are shared between all widget instances.

    theButton: null,
    _handles: null,
    _contextObj: null,
    playArea: {},
    player: {},
    gameObj: null,

    playerscore: 0,
    playerlife: 3,
    playergameover: false,

    newPop: {},

    // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
    constructor: function() {
      this._handles = [];
      this.handleBtn = this.handleBtn.bind(this);
    },

    // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
    postCreate: function() {
      this.playArea.stats = document.querySelector(".stats");
      this.playArea.main = document.querySelector(".main");
      this.playArea.game = document.querySelector(".game");
      this.playArea.btns = document.querySelectorAll(".popperbutton");
      this.playArea.page = Array.from(document.querySelectorAll(".page"));
      document.addEventListener("DOMContentLoaded", this.getData());
      
      on(this.theButton, "click", dojoLang.hitch(this, this.handleBtn));

      this._updateRendering();
      this._setupEvents();
    },

    handleBtn: function() {
      if (this.theButton.classList.contains("newGame")) {
          this.startGame();
      };
      if(this.playergameover == true){
        this.playerscore = 0;
        this.playerlife = 3;
        this.playergameover = false;
        this.updateScore();
      };
    },

    getData: function() {

        this.gameObj = "";

        this.playArea.main.classList.add("visible");
        fetch("https://api.myjson.com/bins/gungm")
          .then((res) => res.json())
          .then((data) => {
            this.gameObj = data.data;
            console.log(this.gameObj);
            this.buildBoard();
        })
    },

    updateScore: function() {
        this.playArea.scorer.innerHTML = "Score: " + this.playerscore + " Lives: " + this.playerlife;
    },

    buildBoard: function() {
        this.playArea.scorer = document.createElement("span");
        this.playArea.scorer.innerHTML = "Press Button to Start";
        this.playArea.stats.appendChild(this.playArea.scorer);
        let rows = 4;
        let cols = 4;
        let cnt = 0;
        this.playArea.game.style.width = cols * 100 + (cols * 2);
        this.playArea.game.style.margin = "auto";
        for (let y = 0; y < rows; y++) {
            let divMain = document.createElement("div");
            divMain.setAttribute("class", "row");
            divMain.style.width = cols * 100 + (cols * 2);
            for (let x = 0; x < cols; x++) {
                let div = document.createElement("div");
                div.setAttribute("class", "pop");
                cnt++;
                div.innerText = cnt;
                div.cnt = cnt;
                divMain.appendChild(div);
            }
            this.playArea.game.appendChild(divMain);
        }
    },

    startGame: function() {
        this.playArea.main.classList.remove("visible");
        this.playArea.game.classList.add("visible");
        
        this.startPop();
        this.updateScore();
    },

    randomUp: function() {
        const pops = document.querySelectorAll(".pop");
        const idx = Math.floor(Math.random() * pops.length);
        if (pops[idx].cnt == this.playArea.last) {
            return this.randomUp();
        }
        this.playArea.last = pops[idx].cnt;
        return pops[idx];
    },

    startPop: function() {
        var self = this;

        this.hitPop = this.hitPop.bind(this);

        this.newPop = this.randomUp();
        this.newPop.classList.add("active");
        this.newPop.addEventListener("click", this.hitPop);
        const time = Math.round(Math.random() * (1500) + 750);
        const val = Math.floor(Math.random() * this.gameObj.length);
        this.newPop.old = this.newPop.innerText;
        this.newPop.v = this.gameObj[val].value;
        this.newPop.innerHTML = this.gameObj[val].icon + "<br>" + this.gameObj[val].value;
        this.playArea.inPlay = setTimeout(function () {
            self.newPop.classList.remove("active");
            self.newPop.removeEventListener("click", self.hitPop);
            self.newPop.innerText = self.newPop.old;
            if (self.newPop.v > 0) {
              self.playerlife--;
              self.playArea.scorer.innerHTML = "Score: " + self.playerscore + " Lives: " + self.playerlife;
            }
            if (self.playerlife <= 0) {
              self.gameOver();
            }
            if (!self.playergameover) {
              self.startPop();
            }
        }, time);
    },

    gameOver: function() {
        this.playergameover = true;
        this.playArea.main.classList.add("visible");
        this.playArea.game.classList.remove("visible");
        document.querySelector(".newGame").innerText = "Try Again";
    },

    hitPop: function(e) {

        console.log(e.target.cnt);
        console.log(e.target.v);
        let newPop = e.target;
        this.playerscore = this.playerscore + newPop.v;
        this.playArea.scorer.innerHTML = "Score: " + this.playerscore + " Lives: " + this.playerlife;
        newPop.classList.remove("active");
        newPop.removeEventListener("click", this.hitPop);
        newPop.innerText = newPop.old;
        clearTimeout(this.playArea.inPlay);
        if (!this.playergameover) {
            this.startPop();
        }
    },

    // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
    update: function(obj, callback) {
      this._contextObj = obj;
      this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
    },

    enable: function() {},
    disable: function() {},
    resize: function(box) {},
    // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
    uninitialize: function() {
      // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
    },

    // Attach events to HTML dom elements
    _setupEvents: function() {},

    // Rerender the interface.
    _updateRendering: function(callback) {
      if (this._contextObj !== null) {
      } else {
      }
      // The callback, coming from update, needs to be executed, to let the page know it finished rendering
      this._executeCallback(callback, "_updateRendering");
    },
    _executeCallback: function(cb, from) {
      if (cb && typeof cb === "function") {
        cb();
      }
    }
  });
});

require(["QuickClickPopper/widget/QuickClickPopper"]);
