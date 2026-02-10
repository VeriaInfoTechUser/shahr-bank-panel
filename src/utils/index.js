import {
  defaultDirection,
  localeOptions,
  defaultLocale,
  cookieDomain
} from '../constants/config'

export const getDirection = () => {
  let direction = defaultDirection
  if (localStorage.getItem('direction')) {
    const localValue = localStorage.getItem('direction')
    if (localValue === 'rtl' || localValue === 'ltr') {
      direction = localValue
    }
  }
  return {
    direction,
    isRtl: direction === 'rtl'
  }
}

export const setDirection = localValue => {
  let direction = 'ltr'
  if (localValue === 'rtl' || localValue === 'ltr') {
    direction = localValue
  }
  localStorage.setItem('direction', direction)
}

export const getCurrentLanguage = () => {
  let locale = defaultLocale;
  try {
    if (localStorage.getItem('currentLanguage') && localeOptions.filter(x => x.id === localStorage.getItem('currentLanguage')).length > 0) {
      locale = localStorage.getItem('currentLanguage');
    }
  } catch (error) {
    console.log(">>>> src/utils/index.js : getCurrentLanguage -> error", error)
    locale = defaultLocale;
  }
  return locale;
}

export const setCurrentLanguage = (lang) => {
  try {
    localStorage.setItem('currentLanguage', lang)
  } catch (error) {
    console.log(">>>> src/utils/index.js : setCurrentLanguage -> error", error)
  }
}

export const getCurrentUser = () => {
  let user = null;
  try {
    user = localStorage.getItem('user') != null ? JSON.parse(localStorage.getItem('user')) : null;
  } catch (error) {
    console.log(">>>> src/utils/index.js : getCurrentUser -> error", error)
    user = null;
  }
  return user;
}


export const setCurrentActiveStandard = (standard) => {
  try {
    if (standard) {
      localStorage.setItem('activeStandard', JSON.stringify(standard));
    } else {
      localStorage.removeItem('activeStandard');
    }
  } catch (error) {
    console.log(">>> setCurrentActiveStandard -> error", error)
  }
};

export const getCurrentActiveStandard = () => {
  let standard = null;
  try {
    standard = localStorage.getItem('activeStandard') != null ? JSON.parse(localStorage.getItem('activeStandard')) : null;
  } catch (error) {
    console.log(">>>> src/utils/index.js : getCurrentActiveStandard -> error", error)
    standard = null;
  }
  return standard;
}
///TODO:check old methods of set and get cookie
export const setCookie = (name, value, expirationTimestamp) => {
  const expires = `expires=${new Date(expirationTimestamp * 1000).toUTCString()}`;
  const domain = `domain=${cookieDomain}`;
  const path = 'path=/';
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; ${path}`;
};
export const getCookie = (name) => {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
export const eraseCookie = (name) => {
  document.cookie = name + `=;  expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${cookieDomain};  path=/;`;
}
export const setCurrentUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.log(">>>> src/utils/index.js : setCurrentUser -> error", error)
  }
}


export const setActiveCompanyInStorage = (company) => {
  try {
    localStorage.setItem('activeCompany', JSON.stringify(company))
  } catch (error) {
    console.log(">>>> src/utils/index.js : activeCompany -> error", error)
  }
}

export const getActiveCompanyFromStorage = () => {
  let activeCompany = null;
  try {
    activeCompany = localStorage.getItem('activeCompany') != null ? JSON.parse(localStorage.getItem('activeCompany')) : null;
  } catch (error) {
    console.log(">>>> src/utils/index.js : getActiveCompany -> error", error)
    activeCompany = null;
  }
  return activeCompany;
}
export const parseData = (data) => {

  function buildNodes(items, group, mainNode) {
    var centralGroup = 'main';
    var nodes = [];
    for (var n in items) {
      var gr = (n == mainNode ? centralGroup : group);
      if (items[n].length == 0)
        gr += '-dead-end';
      nodes.push({
        'name': n,
        'group': gr
      });
    }

    return nodes;
  }

  function buildLinks(items, linkVal, nodes) {

    function getNodeIndex(node) {
      for (var i in nodes) {
        if (nodes[i].name == node)
          return parseInt(i);
      }
      return -1;
    }

    var links = [];
    for (var n in items) {
      var source = getNodeIndex(n);
      for (var l in items[n]) {
        var target = getNodeIndex(items[n][l]);

        // There is no node of this target. Add it as dead-end.
        if (target == -1) {
          var linkNodeEquiv = {
            'fwd': 'ip',
            'rev': 'hostname'
          }
          nodes.push({
            'name': items[n][l],
            'group': linkNodeEquiv[linkVal] + '-dead-end'
          });
          target = getNodeIndex(items[n][l]);
        }

        links.push({
          'source': source,
          'target': target,
          'value': linkVal
        });
      }
    }
    return links;
  }


  var res = {}
  res.nodes = buildNodes(data.reverse_nodes, 'ip', data.resource).concat(buildNodes(data.forward_nodes, 'hostname', data.resource));
  res.links = buildLinks(data.forward_nodes, 'fwd', res.nodes).concat(buildLinks(data.reverse_nodes, 'rev', res.nodes));

  return res;
}

export const plotForceChart = (d3, elem, width, height, data) => {

  var SCALINGFACTOR = Math.sqrt(width * height / data.nodes.length) / 115;
  var FONTSIZE = SCALINGFACTOR * 7; // default: 12
  var RECTWIDTH2FONTSIZE = FONTSIZE * 0.62;
  var RECTHEIGHT = FONTSIZE * 1.7;
  var PARALLELLINEGAP = RECTHEIGHT * 0.13;
  var LINKTHICKNESS = SCALINGFACTOR * 0.6;
  var LINKDISTANCE = SCALINGFACTOR * 65;
  var FORCECHARGE = -SCALINGFACTOR * 560; // Def: -120

  var LEGENDYSPACE = 0.08;

  var MAXNODECHARS = 25;

  var INITALPHA = .7;
  var INITALPHATHRESHOLD = .03; // Wait until alpha (cooldown factor) reaches this value before animating changes

  var svg = d3.select(elem[0]).append("svg")
    .attr("width", width)
    .attr("height", height)
    .style('overflow', 'hidden');

  svg.append("text")
    .text("(click-drag to rearrange nodes)")
    .attr("x", width / 2)
    .attr("y", height * (1 - LEGENDYSPACE))
    .style("text-anchor", "middle")
    .attr('dy', '-.6em')
    .style('font', Math.min(15, width * 0.018) + 'px sans-serif')
    .style('fill', '#C0C0C0');

  var nodeColor = d3.scale.ordinal()
    .domain(['main', 'hostname', 'ip'])
    .range(['#e6550d', '#2ca02c', '#1f77b4']);

  var linkColor = d3.scale.ordinal()
    .domain(['fwd', 'rev'])
    .range(['darkgreen', 'darkblue']);

  var force = d3.layout.force()
    .charge(FORCECHARGE)
    .linkDistance(LINKDISTANCE)
    .linkStrength(.75)
    .size([width, height * (1 - LEGENDYSPACE)]);

  svg.append("marker")
    .attr("id", 'arrow-fwd')
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 9)
    .attr("refY", 0)
    .attr("markerWidth", 7)
    .attr("markerHeight", 7)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr('fill', linkColor('fwd'))
    .style("stroke-dasharray", null);

  svg.append("marker")
    .attr("id", 'arrow-rev')
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 9)
    .attr("refY", 0)
    .attr("markerWidth", 7)
    .attr("markerHeight", 7)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr('fill', linkColor('rev'))
    .style("stroke-dasharray", null);

  force.nodes(data.nodes)
    .links(data.links);

  force.start()
    .alpha(INITALPHA);

  for (var i = 400; i > 0; --i) { // Max cycle dampening to avoid infinite looping due to incorrect threshold
    force.tick();
    if (force.alpha() < INITALPHATHRESHOLD)
      break;
  }

  var link = svg.selectAll(".link")
    .data(data.links)
    .enter().append("line")
    .attr("class", "link")
    .attr("marker-end", function (d) {
      return "url(#arrow-" + d.value + ")";
    })
    .style("stroke-width", LINKTHICKNESS + 'px')
    .style("stroke", function (d) {
      return linkColor(d.value);
    })
    .style("stroke-dasharray", function (d) {
      return d.value == 'fwd' ? null : '7,3';
    })
    .style("stroke-opacity", '.75');

  var node = svg.selectAll(".node")
    .data(data.nodes)
    .enter().append("g")
    .attr("class", "node")

  node.call(force.drag);

  node.append("rect")
    .attr("width", function (d) {
      return Math.min(d.name.length, MAXNODECHARS) * RECTWIDTH2FONTSIZE;
    })
    .attr("height", RECTHEIGHT)
    .attr("rx", RECTHEIGHT * 0.3)
    .attr("ry", RECTHEIGHT * 0.3)
    .style("fill", function (d) {
      return nodeColor(d.group.split('-')[0]);
    })
    .style("fill-opacity", 0.87)
    .style("stroke-width", RECTHEIGHT * 0.08)
    .style("stroke", function (d) {
      return (d.group.indexOf('dead-end') != -1) ? 'brown' : '#fff';
    })
    .style("stroke-opacity", 0.7)
    .style("stroke-dasharray", function (d) {
      return (d.group.indexOf('dead-end') != -1) ? '8,5' : null;
    });

  node.append("text")
    .text(function (d) {
      var name = d.name.length <= MAXNODECHARS ? d.name :
        (
          d.name.substring(0, MAXNODECHARS * 2 / 3)
          + '...'
          + d.name.substring(d.name.length - MAXNODECHARS / 3, d.name.length)
        );
      return name;
    })
    .style("text-anchor", "middle")
    .attr('dy', '.35em')
    .style('font', FONTSIZE + 'px sans-serif')
    .style('fill', '#F0F0F0');

  node.append("title")
    .text(function (d) {
      return d.name;
    });

  drawLegend();

  force.on("tick", function () {

    link.attr("x1", function (d) {
      return coordBoundary(d.source, d.target, true)[0];
    })
      .attr("y1", function (d) {
        return coordBoundary(d.source, d.target, false)[1];
      })
      .attr("x2", function (d) {
        return coordBoundary(d.target, d.source, false)[0];
      })
      .attr("y2", function (d) {
        return coordBoundary(d.target, d.source, true)[1];
      });

    node.select('rect')
      .attr("x", function (d) {
        return d.x - Math.min(d.name.length, MAXNODECHARS) * RECTWIDTH2FONTSIZE / 2;
      })
      .attr("y", function (d) {
        return d.y - RECTHEIGHT / 2;
      });

    node.select('text')
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      });
  });

  function coordBoundary(n, nt, leftSide) {
    var cotan = Math.abs((n.x - nt.x) / (n.y - nt.y));
    var b = [Math.min(n.name.length, MAXNODECHARS) * RECTWIDTH2FONTSIZE / 2, RECTHEIGHT / 2];
    var a = [Math.min(b[0], b[1] * cotan), Math.min(b[1], b[0] / cotan)];
    var result = [n.x + (n.x < nt.x ? a[0] : -a[0]), n.y + (n.y < nt.y ? a[1] : -a[1])];

    if (PARALLELLINEGAP == 0)
      return result;

    // To avoid line overlap, move links of different types to each side
    var moveBias = (leftSide ? -1 : 1) * PARALLELLINEGAP;
    var moveVals = [moveBias * (1 + a[0] / b[0] * 2.5), moveBias * (1 + a[1] / b[1]) * 0.7];

    if (a[0] == b[0]) { // Horizontal edge
      result[1] += moveVals[1] * (n.x < nt.x ? 1 : -1);
      result[1] = Math.max(n.y - b[1], Math.min(n.y + b[1], result[1]));

    }
    if (a[1] == b[1]) {// Vertical edge
      result[0] += moveVals[0] * (n.y < nt.y ? 1 : -1);
      result[0] = Math.max(n.x - b[0], Math.min(n.x + b[0], result[0]));
    }

    return result;
  }

  function drawLegend() {

    var MARGINRATIO = [0.25, 0.4];

    var nodes = [
      ['Source', 'main'],
      ['Hostname', 'hostname'],
      ['IP Address', 'ip'],
      ['Unresolved', 'dead-end']
    ];

    var links = [
      [['Forward', '(A/AAAA/CNAME)'], 'fwd'],
      ['Reverse (PTR)', 'rev']
    ];

    var elemSize = [
      width / (nodes.length + links.length),
      height * LEGENDYSPACE
    ];

    var LABELFONTSIZE = Math.min(elemSize[1] * 0.27, elemSize[0] / (nodes.length + links.length) * 0.7);

    var legend = svg.append('g');

    legend.append("rect")
      .attr("x", 2)
      .attr("y", height * (1 - LEGENDYSPACE))
      .attr("width", width - 2)
      .attr("height", elemSize[1] - 1)
      .attr("rx", 6)
      .attr("ry", 6)
      .style("fill", '#E0E0E0')
      .style("fill-opacity", 0.8)
      .style("stroke-width", '1')
      .style("stroke", '#707070');

    function getPosition(itemNr) {
      return {
        'x': elemSize[0] * itemNr + elemSize[0] * MARGINRATIO[0] / 2,
        'y': height * (1 - LEGENDYSPACE) + elemSize[1] * MARGINRATIO[1] / 2,
        'width': elemSize[0] * (1 - MARGINRATIO[0]),
        'height': elemSize[1] * (1 - MARGINRATIO[1])
      }
    }

    function drawNodeLegend(pos, text, group) {

      var isDashed = group.indexOf('dead-end') != -1;
      var coords = getPosition(pos);
      var label = legend.append('g');

      label.append("rect")
        .attr("x", coords.x)
        .attr("y", coords.y)
        .attr("width", coords.width)
        .attr("height", coords.height)
        .attr("rx", 6)
        .attr("ry", 6)
        .style("fill", (isDashed ? '#fff' : nodeColor(group)))
        .style("fill-opacity", 0.95)
        .style("stroke-width", coords.height * 0.09)
        .style("stroke", (isDashed ? 'brown' : '#fff'))
        .style("stroke-opacity", 0.9)
        .style("stroke-dasharray", (isDashed ? '8,5' : null));

      var txt = label.append("text")
        .text(text)
        .attr("x", coords.x + coords.width / 2)
        .attr("y", coords.y + coords.height / 2)
        .style("text-anchor", "middle")
        .attr('dy', '.35em')
        .style('font', LABELFONTSIZE + 'px sans-serif')
        .style('fill', (isDashed ? '#707070' : '#F0F0F0'));

      label.append("title")
        .text(text);
    }

    function drawLinkLegend(pos, text, group) {
      var coords = getPosition(pos);
      var label = legend.append('g');

      label.append("line")
        .attr("x1", coords.x)
        .attr("x2", coords.x + coords.width)
        .attr("y1", coords.y + coords.height * 0.2)
        .attr("y2", coords.y + coords.height * 0.2)
        .attr("marker-end", "url(#arrow-" + group + ")")
        .style("stroke-width", coords.height * 0.05 + 'px')
        .style("stroke", linkColor(group))
        .style("stroke-dasharray", (group == 'fwd' ? null : '7,3'))
        .style("stroke-opacity", '.9');

      var txt = label.append("text")
        .attr("x", coords.x + coords.width / 2)
        .attr("y", coords.y + coords.height * 0.85)
        .style("text-anchor", "middle")
        .style('font', LABELFONTSIZE + 'px sans-serif')
        .style('fill', '#707070');

      var multiLine = (text instanceof Object);

      if (multiLine) {
        for (var i = 0, len = text.length; i < len; i++) {
          txt.append("tspan")
            .text(text[i])
            .attr('x', coords.x + coords.width / 2)
            .attr('y', coords.y + coords.height * 0.65)
            .attr('dy', (i > 0) ? LABELFONTSIZE : 0);
        }
      } else {
        txt.text(text);
      }

      label.append("title")
        .text(multiLine ? text.join(" ") : text);
    }

    for (var i in nodes)
      drawNodeLegend(parseInt(i), nodes[i][0], nodes[i][1]);

    for (var i in links)
      drawLinkLegend(nodes.length + parseInt(i), links[i][0], links[i][1]);

  }
}

export const DNSChain = (data, widget_width) => {
  var $this = $(this);
  $this.addClass("bootstrap-enabled");

  var d3Data = parseData(data);

  if (d3Data.links.length == 0)
    this.append(
      $("<ul>")
        .addClass("messages")
        .append(
          $("<li>")
            .addClass("info")
            .append("No " + (data.resource in data.forward_nodes ? "forward DNS records (A/AAAA/CNAME) found for hostname "
              : "reverse DNS records (PTR) found for IP address ") + data.resource + '.')
        )
    )
  else {
    var w = this.width();
    var h = w * (w < 1000 ? 0.85 : 0.48);
    if ($(this).statWidget().get_pref_height())
      h = $(this).statWidget().get_pref_height() * 0.9;

    plotForceChart(this, w, h, d3Data);
  }


  /*******************/

  var metaInfoInput = {
    "queryTime": "MISC HERE: misc.parse_date(data.query_time)",
    "resource": data.resource
  };

  if (widget_width >= ripestat.WIDGET_SIZES.compact) {
    $.extend(metaInfoInput, {"Resolved via": data.nameservers.join(", ")});
    if (data.authoritative_nameservers.length > 0)
      $.extend(metaInfoInput, {"Authoritative Nameservers": data.authoritative_nameservers.join(", ")});
  }

  $('<div>')
    .append("MISC HERE: misc.formatMetaInfo(metaInfoInput, widget_width)")
    .css("fontSize", "0.9em")
    .appendTo(this);

  return this;
};
