/*!
 * JQVMap: jQuery Vector Map Library
 * @author JQVMap <me@peterschmalfeldt.com>
 * @version 1.5.1
 * @link http://jqvmap.com
 * @license https://github.com/manifestinteractive/jqvmap/blob/master/LICENSE
 * @builddate 2016/06/02
 */

var VectorCanvas = function (a, b, c) {
  if (
    ((this.mode = window.SVGAngle ? "svg" : "vml"),
    (this.params = c),
    "svg" === this.mode)
  )
    this.createSvgNode = function (a) {
      return document.createElementNS(this.svgns, a);
    };
  else {
    try {
      document.namespaces.rvml ||
        document.namespaces.add("rvml", "urn:schemas-microsoft-com:vml"),
        (this.createVmlNode = function (a) {
          return document.createElement("<rvml:" + a + ' class="rvml">');
        });
    } catch (d) {
      this.createVmlNode = function (a) {
        return document.createElement(
          "<" + a + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">'
        );
      };
    }
    document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
  }
  "svg" === this.mode
    ? (this.canvas = this.createSvgNode("svg"))
    : ((this.canvas = this.createVmlNode("group")),
      (this.canvas.style.position = "absolute")),
    this.setSize(a, b);
};
VectorCanvas.prototype = {
  svgns: "http://www.w3.org/2000/svg",
  mode: "svg",
  width: 0,
  height: 0,
  canvas: null,
};
var ColorScale = function (a, b, c, d) {
  a && this.setColors(a),
    b && this.setNormalizeFunction(b),
    c && this.setMin(c),
    c && this.setMax(d);
};
ColorScale.prototype = { colors: [] };
var JQVMap = function (a) {
  a = a || {};
  var b,
    c = this,
    d = JQVMap.maps[a.map];
  if (!d)
    throw new Error(
      'Invalid "' +
        a.map +
        '" map parameter. Please make sure you have loaded this map file in your HTML.'
    );
  (this.selectedRegions = []),
    (this.multiSelectRegion = a.multiSelectRegion),
    (this.container = a.container),
    (this.defaultWidth = d.width),
    (this.defaultHeight = d.height),
    (this.color = a.color),
    (this.selectedColor = a.selectedColor),
    (this.hoverColor = a.hoverColor),
    (this.hoverColors = a.hoverColors),
    (this.hoverOpacity = a.hoverOpacity),
    this.setBackgroundColor(a.backgroundColor),
    (this.width = a.container.width()),
    (this.height = a.container.height()),
    this.resize(),
    jQuery(window).resize(function () {
      var d = a.container.width(),
        e = a.container.height();
      if (d && e) {
        (c.width = d),
          (c.height = e),
          c.resize(),
          c.canvas.setSize(c.width, c.height),
          c.applyTransform();
        var f = jQuery.Event("resize.jqvmap");
        jQuery(a.container).trigger(f, [d, e]),
          b &&
            (jQuery(".jqvmap-pin").remove(),
            (c.pinHandlers = !1),
            c.placePins(b.pins, b.mode));
      }
    }),
    (this.canvas = new VectorCanvas(this.width, this.height, a)),
    a.container.append(this.canvas.canvas),
    this.makeDraggable(),
    (this.rootGroup = this.canvas.createGroup(!0)),
    (this.index = JQVMap.mapIndex),
    (this.label = jQuery("<div/>")
      .addClass("jqvmap-label")
      .appendTo(jQuery("body"))
      .hide()),
    a.enableZoom &&
      (jQuery("<div/>")
        .addClass("jqvmap-zoomin")
        .text("+")
        .appendTo(a.container),
      jQuery("<div/>")
        .addClass("jqvmap-zoomout")
        .html("&#x2212;")
        .appendTo(a.container)),
    (c.countries = []);
  for (var e in d.paths) {
    var f = this.canvas.createPath({ path: d.paths[e].path });
    f.setFill(this.color),
      (f.id = c.getCountryId(e)),
      (c.countries[e] = f),
      "svg" === this.canvas.mode
        ? f.setAttribute("class", "jqvmap-region")
        : jQuery(f).addClass("jqvmap-region"),
      jQuery(this.rootGroup).append(f);
  }
  if (
    (jQuery(a.container).delegate(
      "svg" === this.canvas.mode ? "path" : "shape",
      "mouseover mouseout",
      function (b) {
        var e = b.target,
          f = b.target.id.split("_").pop(),
          g = jQuery.Event("labelShow.jqvmap"),
          h = jQuery.Event("regionMouseOver.jqvmap");
        (f = f.toLowerCase()),
          "mouseover" === b.type
            ? (jQuery(a.container).trigger(h, [f, d.paths[f].name]),
              h.isDefaultPrevented() || c.highlight(f, e),
              a.showTooltip &&
                (c.label.text(d.paths[f].name),
                jQuery(a.container).trigger(g, [c.label, f]),
                g.isDefaultPrevented() ||
                  (c.label.show(),
                  (c.labelWidth = c.label.width()),
                  (c.labelHeight = c.label.height()))))
            : (c.unhighlight(f, e),
              c.label.hide(),
              jQuery(a.container).trigger("regionMouseOut.jqvmap", [
                f,
                d.paths[f].name,
              ]));
      }
    ),
    jQuery(a.container).delegate(
      "svg" === this.canvas.mode ? "path" : "shape",
      "click",
      function (b) {
        var e = b.target,
          f = b.target.id.split("_").pop(),
          g = jQuery.Event("regionClick.jqvmap");
        if (
          ((f = f.toLowerCase()),
          jQuery(a.container).trigger(g, [f, d.paths[f].name]),
          !a.multiSelectRegion && !g.isDefaultPrevented())
        )
          for (var h in d.paths)
            (c.countries[h].currentFillColor =
              c.countries[h].getOriginalFill()),
              c.countries[h].setFill(c.countries[h].getOriginalFill());
        g.isDefaultPrevented() ||
          (c.isSelected(f) ? c.deselect(f, e) : c.select(f, e));
      }
    ),
    a.showTooltip &&
      a.container.mousemove(function (a) {
        if (c.label.is(":visible")) {
          var b = a.pageX - 15 - c.labelWidth,
            d = a.pageY - 15 - c.labelHeight;
          0 > b && (b = a.pageX + 15),
            0 > d && (d = a.pageY + 15),
            c.label.css({ left: b, top: d });
        }
      }),
    this.setColors(a.colors),
    this.canvas.canvas.appendChild(this.rootGroup),
    this.applyTransform(),
    (this.colorScale = new ColorScale(
      a.scaleColors,
      a.normalizeFunction,
      a.valueMin,
      a.valueMax
    )),
    a.values && ((this.values = a.values), this.setValues(a.values)),
    a.selectedRegions)
  )
    if (a.selectedRegions instanceof Array)
      for (var g in a.selectedRegions)
        this.select(a.selectedRegions[g].toLowerCase());
    else this.select(a.selectedRegions.toLowerCase());
  if (
    (this.bindZoomButtons(),
    a.pins &&
      ((b = { pins: a.pins, mode: a.pinMode }),
      (this.pinHandlers = !1),
      this.placePins(a.pins, a.pinMode)),
    a.showLabels)
  ) {
    this.pinHandlers = !1;
    var h = {};
    for (e in c.countries)
      "function" != typeof c.countries[e] &&
        ((a.pins && a.pins[e]) || (h[e] = e.toUpperCase()));
    (b = { pins: h, mode: "content" }), this.placePins(h, "content");
  }
  JQVMap.mapIndex++;
};
(JQVMap.prototype = {
  transX: 0,
  transY: 0,
  scale: 1,
  baseTransX: 0,
  baseTransY: 0,
  baseScale: 1,
  width: 0,
  height: 0,
  countries: {},
  countriesColors: {},
  countriesData: {},
  zoomStep: 1.4,
  zoomMaxStep: 4,
  zoomCurStep: 1,
}),
  (JQVMap.xlink = "http://www.w3.org/1999/xlink"),
  (JQVMap.mapIndex = 1),
  (JQVMap.maps = {}),
  (function () {
    var a = {
        colors: 1,
        values: 1,
        backgroundColor: 1,
        scaleColors: 1,
        normalizeFunction: 1,
        enableZoom: 1,
        showTooltip: 1,
        borderColor: 1,
        borderWidth: 1,
        borderOpacity: 1,
        selectedRegions: 1,
        multiSelectRegion: 1,
      },
      b = {
        onLabelShow: "labelShow",
        onLoad: "load",
        onRegionOver: "regionMouseOver",
        onRegionOut: "regionMouseOut",
        onRegionClick: "regionClick",
        onRegionSelect: "regionSelect",
        onRegionDeselect: "regionDeselect",
        onResize: "resize",
      };
    jQuery.fn.vectorMap = function (c) {
      var d = {
          map: "world_en",
          backgroundColor: "#a5bfdd",
          color: "#f4f3f0",
          hoverColor: "#c9dfaf",
          hoverColors: {},
          selectedColor: "#c9dfaf",
          scaleColors: ["#b6d6ff", "#005ace"],
          normalizeFunction: "linear",
          enableZoom: !0,
          showTooltip: !0,
          borderColor: "#818181",
          borderWidth: 1,
          borderOpacity: 0.25,
          selectedRegions: null,
          multiSelectRegion: !1,
        },
        e = this.data("mapObject");
      if ("addMap" === c) JQVMap.maps[arguments[1]] = arguments[2];
      else {
        if ("set" !== c || !a[arguments[1]]) {
          if ("string" == typeof c && "function" == typeof e[c])
            return e[c].apply(e, Array.prototype.slice.call(arguments, 1));
          jQuery.extend(d, c),
            (d.container = this),
            this.css({ position: "relative", overflow: "hidden" }),
            (e = new JQVMap(d)),
            this.data("mapObject", e),
            this.unbind(".jqvmap");
          for (var f in b) d[f] && this.bind(b[f] + ".jqvmap", d[f]);
          var g = jQuery.Event("load.jqvmap");
          return jQuery(d.container).trigger(g, e), e;
        }
        e[
          "set" + arguments[1].charAt(0).toUpperCase() + arguments[1].substr(1)
        ].apply(e, Array.prototype.slice.call(arguments, 2));
      }
    };
  })(jQuery),
  (ColorScale.arrayToRgb = function (a) {
    for (var b, c = "#", d = 0; d < a.length; d++)
      (b = a[d].toString(16)), (c += 1 === b.length ? "0" + b : b);
    return c;
  }),
  (ColorScale.prototype.getColor = function (a) {
    "function" == typeof this.normalize && (a = this.normalize(a));
    for (var b, c = [], d = 0, e = 0; e < this.colors.length - 1; e++)
      (b = this.vectorLength(
        this.vectorSubtract(this.colors[e + 1], this.colors[e])
      )),
        c.push(b),
        (d += b);
    var f = (this.maxValue - this.minValue) / d;
    for (e = 0; e < c.length; e++) c[e] *= f;
    for (e = 0, a -= this.minValue; a - c[e] >= 0; ) (a -= c[e]), e++;
    var g;
    for (
      g =
        e === this.colors.length - 1
          ? this.vectorToNum(this.colors[e]).toString(16)
          : this.vectorToNum(
              this.vectorAdd(
                this.colors[e],
                this.vectorMult(
                  this.vectorSubtract(this.colors[e + 1], this.colors[e]),
                  a / c[e]
                )
              )
            ).toString(16);
      g.length < 6;

    )
      g = "0" + g;
    return "#" + g;
  }),
  (ColorScale.rgbToArray = function (a) {
    return (
      (a = a.substr(1)),
      [
        parseInt(a.substr(0, 2), 16),
        parseInt(a.substr(2, 2), 16),
        parseInt(a.substr(4, 2), 16),
      ]
    );
  }),
  (ColorScale.prototype.setColors = function (a) {
    for (var b = 0; b < a.length; b++) a[b] = ColorScale.rgbToArray(a[b]);
    this.colors = a;
  }),
  (ColorScale.prototype.setMax = function (a) {
    (this.clearMaxValue = a),
      "function" == typeof this.normalize
        ? (this.maxValue = this.normalize(a))
        : (this.maxValue = a);
  }),
  (ColorScale.prototype.setMin = function (a) {
    (this.clearMinValue = a),
      "function" == typeof this.normalize
        ? (this.minValue = this.normalize(a))
        : (this.minValue = a);
  }),
  (ColorScale.prototype.setNormalizeFunction = function (a) {
    "polynomial" === a
      ? (this.normalize = function (a) {
          return Math.pow(a, 0.2);
        })
      : "linear" === a
      ? delete this.normalize
      : (this.normalize = a),
      this.setMin(this.clearMinValue),
      this.setMax(this.clearMaxValue);
  }),
  (ColorScale.prototype.vectorAdd = function (a, b) {
    for (var c = [], d = 0; d < a.length; d++) c[d] = a[d] + b[d];
    return c;
  }),
  (ColorScale.prototype.vectorLength = function (a) {
    for (var b = 0, c = 0; c < a.length; c++) b += a[c] * a[c];
    return Math.sqrt(b);
  }),
  (ColorScale.prototype.vectorMult = function (a, b) {
    for (var c = [], d = 0; d < a.length; d++) c[d] = a[d] * b;
    return c;
  }),
  (ColorScale.prototype.vectorSubtract = function (a, b) {
    for (var c = [], d = 0; d < a.length; d++) c[d] = a[d] - b[d];
    return c;
  }),
  (ColorScale.prototype.vectorToNum = function (a) {
    for (var b = 0, c = 0; c < a.length; c++)
      b += Math.round(a[c]) * Math.pow(256, a.length - c - 1);
    return b;
  }),
  (JQVMap.prototype.applyTransform = function () {
    var a, b, c, d;
    this.defaultWidth * this.scale <= this.width
      ? ((a = (this.width - this.defaultWidth * this.scale) / (2 * this.scale)),
        (c = (this.width - this.defaultWidth * this.scale) / (2 * this.scale)))
      : ((a = 0),
        (c = (this.width - this.defaultWidth * this.scale) / this.scale)),
      this.defaultHeight * this.scale <= this.height
        ? ((b =
            (this.height - this.defaultHeight * this.scale) / (2 * this.scale)),
          (d =
            (this.height - this.defaultHeight * this.scale) / (2 * this.scale)))
        : ((b = 0),
          (d = (this.height - this.defaultHeight * this.scale) / this.scale)),
      this.transY > b
        ? (this.transY = b)
        : this.transY < d && (this.transY = d),
      this.transX > a
        ? (this.transX = a)
        : this.transX < c && (this.transX = c),
      this.canvas.applyTransformParams(this.scale, this.transX, this.transY);
  }),
  (JQVMap.prototype.bindZoomButtons = function () {
    var a = this;
    this.container.find(".jqvmap-zoomin").click(function () {
      a.zoomIn();
    }),
      this.container.find(".jqvmap-zoomout").click(function () {
        a.zoomOut();
      });
  }),
  (JQVMap.prototype.deselect = function (a, b) {
    if (
      ((a = a.toLowerCase()),
      (b = b || jQuery("#" + this.getCountryId(a))[0]),
      this.isSelected(a))
    )
      this.selectedRegions.splice(this.selectIndex(a), 1),
        jQuery(this.container).trigger("regionDeselect.jqvmap", [a]),
        (b.currentFillColor = b.getOriginalFill()),
        b.setFill(b.getOriginalFill());
    else
      for (var c in this.countries)
        this.selectedRegions.splice(this.selectedRegions.indexOf(c), 1),
          (this.countries[c].currentFillColor = this.color),
          this.countries[c].setFill(this.color);
  }),
  (JQVMap.prototype.getCountryId = function (a) {
    return "jqvmap" + this.index + "_" + a;
  }),
  (JQVMap.prototype.getPin = function (a) {
    var b = jQuery("#" + this.getPinId(a));
    return b.html();
  }),
  (JQVMap.prototype.getPinId = function (a) {
    return this.getCountryId(a) + "_pin";
  }),
  (JQVMap.prototype.getPins = function () {
    var a = this.container.find(".jqvmap-pin"),
      b = {};
    return (
      jQuery.each(a, function (a, c) {
        c = jQuery(c);
        var d = c.attr("for").toLowerCase(),
          e = c.html();
        b[d] = e;
      }),
      JSON.stringify(b)
    );
  }),
  (JQVMap.prototype.highlight = function (a, b) {
    (b = b || jQuery("#" + this.getCountryId(a))[0]),
      this.hoverOpacity
        ? b.setOpacity(this.hoverOpacity)
        : this.hoverColors && a in this.hoverColors
        ? ((b.currentFillColor = b.getFill() + ""),
          b.setFill(this.hoverColors[a]))
        : this.hoverColor &&
          ((b.currentFillColor = b.getFill() + ""), b.setFill(this.hoverColor));
  }),
  (JQVMap.prototype.isSelected = function (a) {
    return this.selectIndex(a) >= 0;
  }),
  (JQVMap.prototype.makeDraggable = function () {
    var a,
      b,
      c = !1,
      d = this;
    (d.isMoving = !1), (d.isMovingTimeout = !1);
    var e, f, g, h, i, j, k;
    this.container
      .mousemove(function (e) {
        return (
          c &&
            ((d.transX -= (a - e.pageX) / d.scale),
            (d.transY -= (b - e.pageY) / d.scale),
            d.applyTransform(),
            (a = e.pageX),
            (b = e.pageY),
            (d.isMoving = !0),
            d.isMovingTimeout && clearTimeout(d.isMovingTimeout),
            d.container.trigger("drag")),
          !1
        );
      })
      .mousedown(function (d) {
        return (c = !0), (a = d.pageX), (b = d.pageY), !1;
      })
      .mouseup(function () {
        return (
          (c = !1),
          clearTimeout(d.isMovingTimeout),
          (d.isMovingTimeout = setTimeout(function () {
            d.isMoving = !1;
          }, 100)),
          !1
        );
      })
      .mouseout(function () {
        return c && d.isMoving
          ? (clearTimeout(d.isMovingTimeout),
            (d.isMovingTimeout = setTimeout(function () {
              (c = !1), (d.isMoving = !1);
            }, 100)),
            !1)
          : void 0;
      }),
      jQuery(this.container).bind("touchmove", function (a) {
        var b,
          c,
          l,
          m,
          n = a.originalEvent.touches;
        if (1 === n.length) {
          if (1 === e) {
            if (j === n[0].pageX && k === n[0].pageY) return;
            (l = d.transX),
              (m = d.transY),
              (d.transX -= (j - n[0].pageX) / d.scale),
              (d.transY -= (k - n[0].pageY) / d.scale),
              d.applyTransform(),
              (l !== d.transX || m !== d.transY) && a.preventDefault(),
              (d.isMoving = !0),
              d.isMovingTimeout && clearTimeout(d.isMovingTimeout);
          }
          (j = n[0].pageX), (k = n[0].pageY);
        } else 2 === n.length && (2 === e ? ((c = Math.sqrt(Math.pow(n[0].pageX - n[1].pageX, 2) + Math.pow(n[0].pageY - n[1].pageY, 2)) / h), d.setScale(i * c, f, g), a.preventDefault()) : ((b = jQuery(d.container).offset()), (f = n[0].pageX > n[1].pageX ? n[1].pageX + (n[0].pageX - n[1].pageX) / 2 : n[0].pageX + (n[1].pageX - n[0].pageX) / 2), (g = n[0].pageY > n[1].pageY ? n[1].pageY + (n[0].pageY - n[1].pageY) / 2 : n[0].pageY + (n[1].pageY - n[0].pageY) / 2), (f -= b.left), (g -= b.top), (i = d.scale), (h = Math.sqrt(Math.pow(n[0].pageX - n[1].pageX, 2) + Math.pow(n[0].pageY - n[1].pageY, 2)))));
        e = n.length;
      }),
      jQuery(this.container).bind("touchstart", function () {
        e = 0;
      }),
      jQuery(this.container).bind("touchend", function () {
        e = 0;
      });
  }),
  (JQVMap.prototype.placePins = function (a, b) {
    var c = this;
    if (
      ((!b || ("content" !== b && "id" !== b)) && (b = "content"),
      "content" === b
        ? jQuery.each(a, function (a, b) {
            if (0 !== jQuery("#" + c.getCountryId(a)).length) {
              var d = c.getPinId(a),
                e = jQuery("#" + d);
              e.length > 0 && e.remove(),
                c.container.append(
                  '<div id="' +
                    d +
                    '" for="' +
                    a +
                    '" class="jqvmap-pin" style="position:absolute">' +
                    b +
                    "</div>"
                );
            }
          })
        : jQuery.each(a, function (a, b) {
            if (0 !== jQuery("#" + c.getCountryId(a)).length) {
              var d = c.getPinId(a),
                e = jQuery("#" + d);
              e.length > 0 && e.remove(),
                c.container.append(
                  '<div id="' +
                    d +
                    '" for="' +
                    a +
                    '" class="jqvmap-pin" style="position:absolute"></div>'
                ),
                e.append(jQuery("#" + b));
            }
          }),
      this.positionPins(),
      !this.pinHandlers)
    ) {
      this.pinHandlers = !0;
      var d = function () {
        c.positionPins();
      };
      this.container.bind("zoomIn", d).bind("zoomOut", d).bind("drag", d);
    }
  }),
  (JQVMap.prototype.positionPins = function () {
    var a = this,
      b = this.container.find(".jqvmap-pin");
    jQuery.each(b, function (b, c) {
      c = jQuery(c);
      var d = a.getCountryId(c.attr("for").toLowerCase()),
        e = jQuery("#" + d),
        f = e[0].getBBox(),
        g = a.scale,
        h = a.canvas.rootGroup.getBoundingClientRect(),
        i = a.container[0].getBoundingClientRect(),
        j = { left: h.left - i.left, top: h.top - i.top },
        k = f.x * g + (f.width * g) / 2,
        l = f.y * g + (f.height * g) / 2;
      c.css({
        left: j.left + k - c.width() / 2,
        top: j.top + l - c.height() / 2,
      });
    });
  }),
  (JQVMap.prototype.removePin = function (a) {
    (a = a.toLowerCase()), jQuery("#" + this.getPinId(a)).remove();
  }),
  (JQVMap.prototype.removePins = function () {
    this.container.find(".jqvmap-pin").remove();
  }),
  (JQVMap.prototype.reset = function () {
    for (var a in this.countries) this.countries[a].setFill(this.color);
    (this.scale = this.baseScale),
      (this.transX = this.baseTransX),
      (this.transY = this.baseTransY),
      this.applyTransform();
  }),
  (JQVMap.prototype.resize = function () {
    var a = this.baseScale;
    this.width / this.height > this.defaultWidth / this.defaultHeight
      ? ((this.baseScale = this.height / this.defaultHeight),
        (this.baseTransX =
          Math.abs(this.width - this.defaultWidth * this.baseScale) /
          (2 * this.baseScale)))
      : ((this.baseScale = this.width / this.defaultWidth),
        (this.baseTransY =
          Math.abs(this.height - this.defaultHeight * this.baseScale) /
          (2 * this.baseScale))),
      (this.scale *= this.baseScale / a),
      (this.transX *= this.baseScale / a),
      (this.transY *= this.baseScale / a);
  }),
  (JQVMap.prototype.select = function (a, b) {
    (a = a.toLowerCase()),
      (b = b || jQuery("#" + this.getCountryId(a))[0]),
      this.isSelected(a) ||
        (this.multiSelectRegion
          ? this.selectedRegions.push(a)
          : (this.selectedRegions = [a]),
        jQuery(this.container).trigger("regionSelect.jqvmap", [a]),
        this.selectedColor &&
          b &&
          ((b.currentFillColor = this.selectedColor),
          b.setFill(this.selectedColor)));
  }),
  (JQVMap.prototype.selectIndex = function (a) {
    a = a.toLowerCase();
    for (var b = 0; b < this.selectedRegions.length; b++)
      if (a === this.selectedRegions[b]) return b;
    return -1;
  }),
  (JQVMap.prototype.setBackgroundColor = function (a) {
    this.container.css("background-color", a);
  }),
  (JQVMap.prototype.setColors = function (a, b) {
    if ("string" == typeof a)
      this.countries[a].setFill(b),
        this.countries[a].setAttribute("original", b);
    else {
      var c = a;
      for (var d in c)
        this.countries[d] &&
          (this.countries[d].setFill(c[d]),
          this.countries[d].setAttribute("original", c[d]));
    }
  }),
  (JQVMap.prototype.setNormalizeFunction = function (a) {
    this.colorScale.setNormalizeFunction(a),
      this.values && this.setValues(this.values);
  }),
  (JQVMap.prototype.setScale = function (a) {
    (this.scale = a), this.applyTransform();
  }),
  (JQVMap.prototype.setScaleColors = function (a) {
    this.colorScale.setColors(a), this.values && this.setValues(this.values);
  }),
  (JQVMap.prototype.setValues = function (a) {
    var b,
      c = 0,
      d = Number.MAX_VALUE;
    for (var e in a)
      (e = e.toLowerCase()),
        (b = parseFloat(a[e])),
        isNaN(b) || (b > c && (c = a[e]), d > b && (d = b));
    d === c && c++, this.colorScale.setMin(d), this.colorScale.setMax(c);
    var f = {};
    for (e in a)
      (e = e.toLowerCase()),
        (b = parseFloat(a[e])),
        (f[e] = isNaN(b) ? this.color : this.colorScale.getColor(b));
    this.setColors(f), (this.values = a);
  }),
  (JQVMap.prototype.unhighlight = function (a, b) {
    (a = a.toLowerCase()),
      (b = b || jQuery("#" + this.getCountryId(a))[0]),
      b.setOpacity(1),
      b.currentFillColor && b.setFill(b.currentFillColor);
  }),
  (JQVMap.prototype.zoomIn = function () {
    var a = this,
      b =
        (jQuery("#zoom").innerHeight() - 12 - 30 - 6 - 7 - 6) /
        (this.zoomMaxStep - this.zoomCurStep);
    if (a.zoomCurStep < a.zoomMaxStep) {
      (a.transX -= (a.width / a.scale - a.width / (a.scale * a.zoomStep)) / 2),
        (a.transY -=
          (a.height / a.scale - a.height / (a.scale * a.zoomStep)) / 2),
        a.setScale(a.scale * a.zoomStep),
        a.zoomCurStep++;
      var c = jQuery("#zoomSlider");
      c.css("top", parseInt(c.css("top"), 10) - b),
        a.container.trigger("zoomIn");
    }
  }),
  (JQVMap.prototype.zoomOut = function () {
    var a = this,
      b =
        (jQuery("#zoom").innerHeight() - 12 - 30 - 6 - 7 - 6) /
        (this.zoomMaxStep - this.zoomCurStep);
    if (a.zoomCurStep > 1) {
      (a.transX += (a.width / (a.scale / a.zoomStep) - a.width / a.scale) / 2),
        (a.transY +=
          (a.height / (a.scale / a.zoomStep) - a.height / a.scale) / 2),
        a.setScale(a.scale / a.zoomStep),
        a.zoomCurStep--;
      var c = jQuery("#zoomSlider");
      c.css("top", parseInt(c.css("top"), 10) + b),
        a.container.trigger("zoomOut");
    }
  }),
  (VectorCanvas.prototype.applyTransformParams = function (a, b, c) {
    "svg" === this.mode
      ? this.rootGroup.setAttribute(
          "transform",
          "scale(" + a + ") translate(" + b + ", " + c + ")"
        )
      : ((this.rootGroup.coordorigin =
          this.width - b + "," + (this.height - c)),
        (this.rootGroup.coordsize = this.width / a + "," + this.height / a));
  }),
  (VectorCanvas.prototype.createGroup = function (a) {
    var b;
    return (
      "svg" === this.mode
        ? (b = this.createSvgNode("g"))
        : ((b = this.createVmlNode("group")),
          (b.style.width = this.width + "px"),
          (b.style.height = this.height + "px"),
          (b.style.left = "0px"),
          (b.style.top = "0px"),
          (b.coordorigin = "0 0"),
          (b.coordsize = this.width + " " + this.height)),
      a && (this.rootGroup = b),
      b
    );
  }),
  (VectorCanvas.prototype.createPath = function (a) {
    var b;
    if ("svg" === this.mode)
      (b = this.createSvgNode("path")),
        b.setAttribute("d", a.path),
        null !== this.params.borderColor &&
          b.setAttribute("stroke", this.params.borderColor),
        this.params.borderWidth > 0 &&
          (b.setAttribute("stroke-width", this.params.borderWidth),
          b.setAttribute("stroke-linecap", "round"),
          b.setAttribute("stroke-linejoin", "round")),
        this.params.borderOpacity > 0 &&
          b.setAttribute("stroke-opacity", this.params.borderOpacity),
        (b.setFill = function (a) {
          this.setAttribute("fill", a),
            null === this.getAttribute("original") &&
              this.setAttribute("original", a);
        }),
        (b.getFill = function () {
          return this.getAttribute("fill");
        }),
        (b.getOriginalFill = function () {
          return this.getAttribute("original");
        }),
        (b.setOpacity = function (a) {
          this.setAttribute("fill-opacity", a);
        });
    else {
      (b = this.createVmlNode("shape")),
        (b.coordorigin = "0 0"),
        (b.coordsize = this.width + " " + this.height),
        (b.style.width = this.width + "px"),
        (b.style.height = this.height + "px"),
        (b.fillcolor = JQVMap.defaultFillColor),
        (b.stroked = !1),
        (b.path = VectorCanvas.pathSvgToVml(a.path));
      var c = this.createVmlNode("skew");
      (c.on = !0),
        (c.matrix = "0.01,0,0,0.01,0,0"),
        (c.offset = "0,0"),
        b.appendChild(c);
      var d = this.createVmlNode("fill");
      b.appendChild(d),
        (b.setFill = function (a) {
          (this.getElementsByTagName("fill")[0].color = a),
            null === this.getAttribute("original") &&
              this.setAttribute("original", a);
        }),
        (b.getFill = function () {
          return this.getElementsByTagName("fill")[0].color;
        }),
        (b.getOriginalFill = function () {
          return this.getAttribute("original");
        }),
        (b.setOpacity = function (a) {
          this.getElementsByTagName("fill")[0].opacity =
            parseInt(100 * a, 10) + "%";
        });
    }
    return b;
  }),
  (VectorCanvas.prototype.pathSvgToVml = function (a) {
    var b,
      c,
      d = "",
      e = 0,
      f = 0;
    return a
      .replace(
        /([MmLlHhVvCcSs])((?:-?(?:\d+)?(?:\.\d+)?,?\s?)+)/g,
        function (a, g, h) {
          (h = h.replace(/(\d)-/g, "$1,-").replace(/\s+/g, ",").split(",")),
            h[0] || h.shift();
          for (var i = 0, j = h.length; j > i; i++)
            h[i] = Math.round(100 * h[i]);
          switch (g) {
            case "m":
              (e += h[0]), (f += h[1]), (d = "t" + h.join(","));
              break;
            case "M":
              (e = h[0]), (f = h[1]), (d = "m" + h.join(","));
              break;
            case "l":
              (e += h[0]), (f += h[1]), (d = "r" + h.join(","));
              break;
            case "L":
              (e = h[0]), (f = h[1]), (d = "l" + h.join(","));
              break;
            case "h":
              (e += h[0]), (d = "r" + h[0] + ",0");
              break;
            case "H":
              (e = h[0]), (d = "l" + e + "," + f);
              break;
            case "v":
              (f += h[0]), (d = "r0," + h[0]);
              break;
            case "V":
              (f = h[0]), (d = "l" + e + "," + f);
              break;
            case "c":
              (b = e + h[h.length - 4]),
                (c = f + h[h.length - 3]),
                (e += h[h.length - 2]),
                (f += h[h.length - 1]),
                (d = "v" + h.join(","));
              break;
            case "C":
              (b = h[h.length - 4]),
                (c = h[h.length - 3]),
                (e = h[h.length - 2]),
                (f = h[h.length - 1]),
                (d = "c" + h.join(","));
              break;
            case "s":
              h.unshift(f - c),
                h.unshift(e - b),
                (b = e + h[h.length - 4]),
                (c = f + h[h.length - 3]),
                (e += h[h.length - 2]),
                (f += h[h.length - 1]),
                (d = "v" + h.join(","));
              break;
            case "S":
              h.unshift(f + f - c),
                h.unshift(e + e - b),
                (b = h[h.length - 4]),
                (c = h[h.length - 3]),
                (e = h[h.length - 2]),
                (f = h[h.length - 1]),
                (d = "c" + h.join(","));
          }
          return d;
        }
      )
      .replace(/z/g, "");
  }),
  (VectorCanvas.prototype.setSize = function (a, b) {
    if ("svg" === this.mode)
      this.canvas.setAttribute("width", a),
        this.canvas.setAttribute("height", b);
    else if (
      ((this.canvas.style.width = a + "px"),
      (this.canvas.style.height = b + "px"),
      (this.canvas.coordsize = a + " " + b),
      (this.canvas.coordorigin = "0 0"),
      this.rootGroup)
    ) {
      for (
        var c = this.rootGroup.getElementsByTagName("shape"),
          d = 0,
          e = c.length;
        e > d;
        d++
      )
        (c[d].coordsize = a + " " + b),
          (c[d].style.width = a + "px"),
          (c[d].style.height = b + "px");
      (this.rootGroup.coordsize = a + " " + b),
        (this.rootGroup.style.width = a + "px"),
        (this.rootGroup.style.height = b + "px");
    }
    (this.width = a), (this.height = b);
  });
