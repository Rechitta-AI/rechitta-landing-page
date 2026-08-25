import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http, { Server as Server$1 } from 'node:http';
import https, { Server } from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const IM_RE = /\?/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
const ENC_ENC_SLASH_RE = /%252f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function encodePath(text) {
  return encode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F").replace(ENC_ENC_SLASH_RE, "%2F").replace(AMPERSAND_RE, "%26").replace(PLUS_RE, "%2B");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const PROTOCOL_SCRIPT_RE = /^[\s\0]*(blob|data|javascript|vbscript):$/i;
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function isScriptProtocol(protocol) {
  return !!protocol && PROTOCOL_SCRIPT_RE.test(protocol);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const nextChar = input[_base.length];
  if (nextChar && nextChar !== "/" && nextChar !== "?") {
    return input;
  }
  const trimmed = input.slice(_base.length).replace(/^\/+/, "");
  return "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = { ...defaults };
  for (const key of Object.keys(baseObject)) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),s&&s(),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m(e._destroy,t._destroy);}};function _(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function m(...n){return function(...e){for(const t of n)t(...e);}}const g=_();class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S=new Set([101,204,205,304]);async function b(n,e){const t=new y,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !/\bchunked\b/i.test(
    String(event.node.req.headers["transfer-encoding"] ?? "")
  )) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
async function readBody(event, options = {}) {
  const request = event.node.req;
  if (hasProp(request, ParsedBodySymbol)) {
    return request[ParsedBodySymbol];
  }
  const contentType = request.headers["content-type"] || "";
  const body = await readRawBody(event);
  let parsed;
  if (contentType === "application/json") {
    parsed = _parseJSON(body, options.strict ?? true);
  } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
    parsed = _parseURLEncodedBody(body);
  } else if (contentType.startsWith("text/")) {
    parsed = body;
  } else {
    parsed = _parseJSON(body, options.strict ?? false);
  }
  request[ParsedBodySymbol] = parsed;
  return parsed;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}
function _parseJSON(body = "", strict) {
  if (!body) {
    return void 0;
  }
  try {
    return destr(body, { strict });
  } catch {
    throw createError$1({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid JSON body"
    });
  }
}
function _parseURLEncodedBody(body) {
  const form = new URLSearchParams(body);
  const parsedForm = /* @__PURE__ */ Object.create(null);
  for (const [key, value] of form.entries()) {
    if (hasProp(parsedForm, key)) {
      if (!Array.isArray(parsedForm[key])) {
        parsedForm[key] = [parsedForm[key]];
      }
      parsedForm[key].push(value);
    } else {
      parsedForm[key] = value;
    }
  }
  return parsedForm;
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _rawReqUrl = event.node.req.url || "/";
    const _reqPath = _decodePath(event._path || _rawReqUrl);
    event._path = _reqPath;
    const _needsRawUrl = _reqPath !== _rawReqUrl;
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _needsRawUrl ? layer.route.length > 1 ? _rawReqUrl.slice(layer.route.length) || "/" : _rawReqUrl : _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function _decodePath(url) {
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);
  const decodedPath = path.includes("%25") ? decodePath(path.replace(/%25/g, "%2525")) : decodePath(path);
  return decodedPath + query;
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s;
const AbortController = globalThis.AbortController || i;
const ofetch = createFetch({ fetch, Headers: Headers$1, AbortController });
const $fetch = ofetch;

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

function serialize$1(input) {
	if (typeof input === "string") return `'${input}'`;
	return new Serializer().serialize(input);
}
const asciiOrder = " _-,;:!?.'\"()[]{}@*/\\&#%`^+<=>|~$0123456789abcdefghijklmnopqrstuvwxyz";
const asciiWeights = /*@__PURE__*/ (function() {
	const weights = /* @__PURE__ */ new Uint8Array(128);
	for (let i = 0; i < 69; i++) weights[asciiOrder.charCodeAt(i)] = i + 1;
	for (let code = 65; code <= 90; code++) weights[code] = weights[code + 32];
	return weights;
})();
function compareStrings(a, b) {
	if (a === b) return 0;
	const length = Math.min(a.length, b.length);
	let tieBreaker = 0;
	for (let i = 0; i < length; i++) {
		const codeA = a.charCodeAt(i);
		const codeB = b.charCodeAt(i);
		if (codeA === codeB) continue;
		const weightA = codeA < 128 && asciiWeights[codeA] ? asciiWeights[codeA] : codeA + 128;
		const weightB = codeB < 128 && asciiWeights[codeB] ? asciiWeights[codeB] : codeB + 128;
		if (weightA !== weightB) return weightA < weightB ? -1 : 1;
		if (tieBreaker === 0) tieBreaker = codeA > codeB ? -1 : 1;
	}
	if (a.length !== b.length) return a.length < b.length ? -1 : 1;
	return tieBreaker;
}
const Serializer = /*@__PURE__*/ (function() {
	class Serializer {
		#context = /* @__PURE__ */ new Map();
		compare(a, b) {
			const typeA = typeof a;
			const typeB = typeof b;
			if (typeA === "string" && typeB === "string") return compareStrings(a, b);
			if (typeA === "number" && typeB === "number") return a - b;
			return compareStrings(this.serialize(a, true), this.serialize(b, true));
		}
		serialize(value, noQuotes) {
			if (value === null) return "null";
			switch (typeof value) {
				case "string": return noQuotes ? value : `'${value}'`;
				case "bigint": return `${value}n`;
				case "object": return this.$object(value);
				case "function": return this.$function(value);
			}
			return String(value);
		}
		serializeObject(object) {
			const objString = Object.prototype.toString.call(object);
			if (objString !== "[object Object]") return this.serializeBuiltInType(objString.length < 10 ? `unknown:${objString}` : objString.slice(8, -1), object);
			const constructor = object.constructor;
			const objName = constructor === Object || constructor === void 0 ? "" : constructor.name;
			if (objName !== "" && globalThis[objName] === constructor) return this.serializeBuiltInType(objName, object);
			if ("toJSON" in object && typeof object.toJSON === "function") {
				const json = object.toJSON();
				return objName + (json !== null && typeof json === "object" ? this.$object(json) : `(${this.serialize(json)})`);
			}
			const keys = Object.keys(object).sort(compareStrings);
			let content = `${objName}{`;
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				content += `${key}:${this.serialize(object[key])}`;
				if (i < keys.length - 1) content += ",";
			}
			return content + "}";
		}
		serializeBuiltInType(type, object) {
			const handler = this["$" + type];
			if (handler) return handler.call(this, object);
			if (typeof object.entries === "function") return this.serializeObjectEntries(type, object.entries());
			throw new Error(`Cannot serialize ${type}`);
		}
		serializeObjectEntries(type, entries) {
			const sortedEntries = Array.from(entries).sort((a, b) => this.compare(a[0], b[0]));
			let content = `${type}{`;
			for (let i = 0; i < sortedEntries.length; i++) {
				const [key, value] = sortedEntries[i];
				content += `${this.serialize(key, true)}:${this.serialize(value)}`;
				if (i < sortedEntries.length - 1) content += ",";
			}
			return content + "}";
		}
		$object(object) {
			let content = this.#context.get(object);
			if (content === void 0) {
				this.#context.set(object, `#${this.#context.size}`);
				content = this.serializeObject(object);
				this.#context.set(object, content);
			}
			return content;
		}
		$function(fn) {
			const fnStr = Function.prototype.toString.call(fn);
			if (fnStr.slice(-15) === "[native code] }") return `${fn.name || ""}()[native]`;
			return `${fn.name}(${fn.length})${fnStr.replace(/\s*\n\s*/g, "")}`;
		}
		$Array(arr) {
			let content = "[";
			for (let i = 0; i < arr.length; i++) {
				content += this.serialize(arr[i]);
				if (i < arr.length - 1) content += ",";
			}
			return content + "]";
		}
		$Date(date) {
			try {
				return `Date(${date.toISOString()})`;
			} catch {
				return `Date(null)`;
			}
		}
		$ArrayBuffer(arr) {
			return `ArrayBuffer[${new Uint8Array(arr).join(",")}]`;
		}
		$Set(set) {
			return `Set${this.$Array(Array.from(set).sort((a, b) => this.compare(a, b)))}`;
		}
		$Map(map) {
			return this.serializeObjectEntries("Map", map.entries());
		}
	}
	for (const type of [
		"Error",
		"RegExp",
		"URL"
	]) Serializer.prototype["$" + type] = function(val) {
		return `${type}(${val})`;
	};
	for (const type of [
		"Int8Array",
		"Uint8Array",
		"Uint8ClampedArray",
		"Int16Array",
		"Uint16Array",
		"Int32Array",
		"Uint32Array",
		"Float32Array",
		"Float64Array"
	]) Serializer.prototype["$" + type] = function(arr) {
		return `${type}[${arr.join(",")}]`;
	};
	for (const type of ["BigInt64Array", "BigUint64Array"]) Serializer.prototype["$" + type] = function(arr) {
		return `${type}[${arr.join("n,")}${arr.length > 0 ? "n" : ""}]`;
	};
	return Serializer;
})();

const fastHash = /*@__PURE__*/ (() => globalThis.process?.getBuiltinModule?.("crypto")?.hash)();
const algorithm = "sha256";
const encoding = "base64url";
function digest(data) {
	if (fastHash) return fastHash(algorithm, data, encoding);
	const h = createHash(algorithm).update(data);
	return globalThis.process?.versions?.webcontainer ? h.digest().toString(encoding) : h.digest(encoding);
}

function hash$1(input) {
	return digest(serialize$1(input));
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "9714f567-0306-4848-96a4-59a129f8ecd7",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {
    "posthogKey": "",
    "posthogHost": "https://rechitta.com/ingest",
    "apiBase": "/api",
    "filmBase": "/film"
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
function executeAsync(function_) {
  const restores = [];
  for (const leaveHandler of asyncHandlers) {
    const restore2 = leaveHandler();
    if (restore2) {
      restores.push(restore2);
    }
  }
  const restore = () => {
    for (const restore2 of restores) {
      restore2();
    }
  };
  let awaitable = function_();
  if (awaitable && typeof awaitable === "object" && "catch" in awaitable) {
    awaitable = awaitable.catch((error) => {
      restore();
      throw error;
    });
  }
  return [awaitable, restore];
}

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

function isPathInScope(pathname, base) {
  let canonical;
  try {
    const pre = pathname.replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
    canonical = new URL(pre, "http://_").pathname;
  } catch {
    return false;
  }
  return !base || canonical === base || canonical.startsWith(base + "/");
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError$1({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError$1({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
	
	if (hasReqHeader(event, "accept", "text/html")) {
		return false;
	}
	return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
	const value = getRequestHeader(event, name);
	return !!(value && typeof value === "string" && value.toLowerCase().includes(includes));
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
	if (event.handled || isJsonRequest(event)) {
		
		return;
	}
	
	const defaultRes = await defaultHandler(error, event, { json: true });
	
	const status = error.status || error.statusCode || 500;
	if (status === 404 && defaultRes.status === 302) {
		setResponseHeaders(event, defaultRes.headers);
		setResponseStatus(event, defaultRes.status, defaultRes.statusText);
		return send(event, JSON.stringify(defaultRes.body, null, 2));
	}
	const errorObject = defaultRes.body;
	
	const url = new URL(errorObject.url);
	errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
	
	errorObject.message = error.unhandled ? errorObject.message || "Server Error" : error.message || errorObject.message || "Server Error";
	
	errorObject.data ||= error.data;
	errorObject.statusText ||= error.statusText || error.statusMessage;
	delete defaultRes.headers["content-type"];
	delete defaultRes.headers["content-security-policy"];
	setResponseHeaders(event, defaultRes.headers);
	
	const reqHeaders = getRequestHeaders(event);
	
	const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"] || !!event.context.nuxt?.["~rendering-error"];
	if (!isRenderingError) {
		event.context.nuxt ||= {};
		event.context.nuxt["~rendering-error"] = true;
	}
	
	const res = isRenderingError ? null : await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject), {
		headers: {
			...reqHeaders,
			"x-nuxt-error": "true"
		},
		redirect: "manual"
	}).catch(() => null);
	if (event.handled) {
		return;
	}
	
	if (!res) {
		const { template } = await import('../_/error-500.mjs');
		setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
		return send(event, template(errorObject));
	}
	const html = await res.text();
	for (const [header, value] of res.headers.entries()) {
		if (header === "set-cookie") {
			appendResponseHeader(event, header, value);
			continue;
		}
		setResponseHeader(event, header, value);
	}
	setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
	return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const plugins = [
  
];

const assets = {
  "/.DS_Store": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"1804-nY2xvopYcuWUjOn7B1EHRVQPeNU\"",
    "mtime": "2026-08-23T05:50:23.706Z",
    "size": 6148,
    "path": "../public/.DS_Store"
  },
  "/favicon-16x16.png": {
    "type": "image/png",
    "etag": "\"258-SBmLlMhqG0TF0ZY7IVrivwC80O4\"",
    "mtime": "2026-08-23T05:50:23.703Z",
    "size": 600,
    "path": "../public/favicon-16x16.png"
  },
  "/favicon-32x32.png": {
    "type": "image/png",
    "etag": "\"1ba-Qav8GlKEYMrVgvYsqq5dZN/JZ+Y\"",
    "mtime": "2026-08-23T05:50:23.705Z",
    "size": 442,
    "path": "../public/favicon-32x32.png"
  },
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"1cd6-YOywqXmWSg4kz4odaWAP/GspHQU\"",
    "mtime": "2026-08-23T05:50:23.704Z",
    "size": 7382,
    "path": "../public/favicon.ico"
  },
  "/robots.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"18-j8OIsL9qGDmNZ+lHhp2tyH4XtaE\"",
    "mtime": "2026-08-23T05:50:23.707Z",
    "size": 24,
    "path": "../public/robots.txt"
  },
  "/brokers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"45-H4s9ZbbbYPRUyJexnhsYCrz38Y8\"",
    "mtime": "2026-08-23T05:50:23.197Z",
    "size": 69,
    "path": "../public/brokers/_payload.json"
  },
  "/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"45-adJ4eKPeY6y9hnT/ncWoG2xqz0Y\"",
    "mtime": "2026-08-23T05:50:23.197Z",
    "size": 69,
    "path": "../public/_payload.json"
  },
  "/brokers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"36ad-OqXESoVYXFdrhS9aHtzH4DRrdW4\"",
    "mtime": "2026-08-23T05:50:23.188Z",
    "size": 13997,
    "path": "../public/brokers/index.html"
  },
  "/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"614f-ehaxXndOXQe/mJfFuODtxj17R48\"",
    "mtime": "2026-08-23T05:50:23.188Z",
    "size": 24911,
    "path": "../public/index.html"
  },
  "/_nuxt/2uyxB2-G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b35-qhiwVMDEJFWYPZ46lZvK23gh0/k\"",
    "mtime": "2026-08-23T05:50:23.228Z",
    "size": 2869,
    "path": "../public/_nuxt/2uyxB2-G.js"
  },
  "/_nuxt/BSIjQbwl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4bc-/mDimyxeIbMkWm+F6Bb2lrOPkLM\"",
    "mtime": "2026-08-23T05:50:23.228Z",
    "size": 1212,
    "path": "../public/_nuxt/BSIjQbwl.js"
  },
  "/_nuxt/BYaF3c0h.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f8-OPmk3IjGChBcUuHB7uJKLrZ2aS0\"",
    "mtime": "2026-08-23T05:50:23.228Z",
    "size": 504,
    "path": "../public/_nuxt/BYaF3c0h.js"
  },
  "/_nuxt/Bvlk5VeP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1167-0QohA3wGmChaCIvqxFxTBztVqeM\"",
    "mtime": "2026-08-23T05:50:23.228Z",
    "size": 4455,
    "path": "../public/_nuxt/Bvlk5VeP.js"
  },
  "/_nuxt/DUZFYkBq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"693-YhOPeJzBDMLRvgZF2jGTvCczyK8\"",
    "mtime": "2026-08-23T05:50:23.228Z",
    "size": 1683,
    "path": "../public/_nuxt/DUZFYkBq.js"
  },
  "/_nuxt/C3DWeMge.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d6b9-OW1pcCw9LC4EQe4X5WBGY6Go1lc\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 54969,
    "path": "../public/_nuxt/C3DWeMge.js"
  },
  "/_nuxt/DjUNueWX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e97-FIGipZnlmPKKEhYAERCQUawVq4w\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 3735,
    "path": "../public/_nuxt/DjUNueWX.js"
  },
  "/_nuxt/PersonaHero.D7eOlvvY.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"57c-9PGM6NagLCZ88LiB/nd8aBF611o\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 1404,
    "path": "../public/_nuxt/PersonaHero.D7eOlvvY.css"
  },
  "/_nuxt/PressStrip.Decbvoga.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1cc-z1aLDgAuty9xlbPv2PSTyQmJP38\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 460,
    "path": "../public/_nuxt/PressStrip.Decbvoga.css"
  },
  "/_nuxt/brokers.Bvr1srDY.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"5bb-Kzkjasqo1Is/L/RAhK2LS5hVRyA\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 1467,
    "path": "../public/_nuxt/brokers.Bvr1srDY.css"
  },
  "/_nuxt/buyers.BKSDarUT.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"504-6QdySfdtZ5tgE+CD6h5qizBAM20\"",
    "mtime": "2026-08-23T05:50:23.230Z",
    "size": 1284,
    "path": "../public/_nuxt/buyers.BKSDarUT.css"
  },
  "/_nuxt/developers.DYg09IPY.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"4e1-/SC+QH6hcQYB51TWCHjv0dXFABo\"",
    "mtime": "2026-08-23T05:50:23.230Z",
    "size": 1249,
    "path": "../public/_nuxt/developers.DYg09IPY.css"
  },
  "/_nuxt/CycLwWXX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11df-2lK3PQFSHubZbKsIC1w1LGkd8zg\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 4575,
    "path": "../public/_nuxt/CycLwWXX.js"
  },
  "/_nuxt/Dnvb8_LB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fb-9acgJGXFHzz0ZwWh42zg5S6esnQ\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 251,
    "path": "../public/_nuxt/Dnvb8_LB.js"
  },
  "/_nuxt/QWk5YMfF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d40-Ntt/2QphFAfxSZSEjs1KNW4gvtc\"",
    "mtime": "2026-08-23T05:50:23.229Z",
    "size": 3392,
    "path": "../public/_nuxt/QWk5YMfF.js"
  },
  "/_nuxt/C3qSe24J.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6ce31-6CD9bbaphTvFM+vbCUEFqykeiL0\"",
    "mtime": "2026-08-23T05:50:23.231Z",
    "size": 446001,
    "path": "../public/_nuxt/C3qSe24J.js"
  },
  "/_nuxt/entry.BCyAcfoo.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"50e-MF0djmiIQcuTOBqyh9vnOuAalbc\"",
    "mtime": "2026-08-23T05:50:23.230Z",
    "size": 1294,
    "path": "../public/_nuxt/entry.BCyAcfoo.css"
  },
  "/_nuxt/error-404.DL_4WIao.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"dca-KnjyV0UbpsrliiJzZx69defY74k\"",
    "mtime": "2026-08-23T05:50:23.230Z",
    "size": 3530,
    "path": "../public/_nuxt/error-404.DL_4WIao.css"
  },
  "/_nuxt/error-500.I1Dtv2V5.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"75a-vEGyJqldBVJrnMfcLsrGaHcxYl0\"",
    "mtime": "2026-08-23T05:50:23.230Z",
    "size": 1882,
    "path": "../public/_nuxt/error-500.I1Dtv2V5.css"
  },
  "/_nuxt/media.C8boxQue.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"d1-PlKZHtOo/gkKQhx2IXnMmk09LIE\"",
    "mtime": "2026-08-23T05:50:23.230Z",
    "size": 209,
    "path": "../public/_nuxt/media.C8boxQue.css"
  },
  "/_nuxt/index.B1l-J2eF.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"44d5-qGkc3Vc+RmZmRLjrX3u+3asCaps\"",
    "mtime": "2026-08-23T05:50:23.231Z",
    "size": 17621,
    "path": "../public/_nuxt/index.B1l-J2eF.css"
  },
  "/developers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"45-H4s9ZbbbYPRUyJexnhsYCrz38Y8\"",
    "mtime": "2026-08-23T05:50:23.197Z",
    "size": 69,
    "path": "../public/developers/_payload.json"
  },
  "/developers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3b04-gm38VSWVC0sO7isa86hvx+Vqo38\"",
    "mtime": "2026-08-23T05:50:23.188Z",
    "size": 15108,
    "path": "../public/developers/index.html"
  },
  "/film/.DS_Store": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"1804-VQ8gRw0cVAicz8fTaBWKhk6sUa8\"",
    "mtime": "2026-08-23T05:50:23.274Z",
    "size": 6148,
    "path": "../public/film/.DS_Store"
  },
  "/film/manifest.json": {
    "type": "application/json",
    "etag": "\"d2f-8eOezbiGx91CYkyCfKbt9cOOs64\"",
    "mtime": "2026-08-23T05:50:23.259Z",
    "size": 3375,
    "path": "../public/film/manifest.json"
  },
  "/buyers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"45-lvhaJB25wYl7B0geeFFTpRVgZFs\"",
    "mtime": "2026-08-23T05:50:23.198Z",
    "size": 69,
    "path": "../public/buyers/_payload.json"
  },
  "/buyers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"372b-s3oax6rAnGQXDLChjuG/9L4X2EA\"",
    "mtime": "2026-08-23T05:50:23.188Z",
    "size": 14123,
    "path": "../public/buyers/index.html"
  },
  "/film/og-hero.jpg": {
    "type": "image/jpeg",
    "etag": "\"18d0a-O9Y4cCjZA4c25XvRVWiOfN145Ic\"",
    "mtime": "2026-08-23T05:50:23.276Z",
    "size": 101642,
    "path": "../public/film/og-hero.jpg"
  },
  "/media/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"45-lvhaJB25wYl7B0geeFFTpRVgZFs\"",
    "mtime": "2026-08-23T05:50:23.197Z",
    "size": 69,
    "path": "../public/media/_payload.json"
  },
  "/brand/rechitta-icon.svg": {
    "type": "image/svg+xml",
    "etag": "\"143-0VTK5opRk4kx4ag0FcFus8wd508\"",
    "mtime": "2026-08-23T05:50:23.273Z",
    "size": 323,
    "path": "../public/brand/rechitta-icon.svg"
  },
  "/brand/rechitta-wordmark.svg": {
    "type": "image/svg+xml",
    "etag": "\"e75-If/ZDzJCAPLI8aSeIaOFut1wdJE\"",
    "mtime": "2026-08-23T05:50:23.274Z",
    "size": 3701,
    "path": "../public/brand/rechitta-wordmark.svg"
  },
  "/media/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"2fa4-3HGG89P7hOKtsjRH+Sw+JzNWo2I\"",
    "mtime": "2026-08-23T05:50:23.188Z",
    "size": 12196,
    "path": "../public/media/index.html"
  },
  "/spline/README.md": {
    "type": "text/markdown; charset=utf-8",
    "etag": "\"409-NM1m3Q6qgMkqDEagB4vC8scuX/U\"",
    "mtime": "2026-08-23T05:50:23.602Z",
    "size": 1033,
    "path": "../public/spline/README.md"
  },
  "/spline/boolean.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1372a-z3CNwPAeRUffndbplIVFjwiADZQ\"",
    "mtime": "2026-08-23T05:50:23.260Z",
    "size": 79658,
    "path": "../public/spline/boolean.js"
  },
  "/spline/gaussian-splat-compression.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1449c-dQqMQ31RyxcgW9t6ygvgX5zMKho\"",
    "mtime": "2026-08-23T05:50:23.593Z",
    "size": 83100,
    "path": "../public/spline/gaussian-splat-compression.js"
  },
  "/spline/howler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6913-zbsNlB4MLrytXrycmV6N4Qb72Po\"",
    "mtime": "2026-08-23T05:50:23.603Z",
    "size": 26899,
    "path": "../public/spline/howler.js"
  },
  "/scenes/scene-curtainwall.png": {
    "type": "image/png",
    "etag": "\"16730f-rnnLlgKjkP0xwyswj/coDNDMLA0\"",
    "mtime": "2026-08-23T05:50:23.472Z",
    "size": 1471247,
    "path": "../public/scenes/scene-curtainwall.png"
  },
  "/spline/navmesh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17381-OwoWVmdjzfNHGDUMXTqPZX8K0ls\"",
    "mtime": "2026-08-23T05:50:23.601Z",
    "size": 95105,
    "path": "../public/spline/navmesh.js"
  },
  "/spline/opentype.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b47a-BrRRWWogHuuMjeAu0ZHTmXEoe44\"",
    "mtime": "2026-08-23T05:50:23.611Z",
    "size": 177274,
    "path": "../public/spline/opentype.js"
  },
  "/spline/process.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1910e-eJR3wWFdC+YpetsykTZ499NlquU\"",
    "mtime": "2026-08-23T05:50:23.610Z",
    "size": 102670,
    "path": "../public/spline/process.js"
  },
  "/spline/scene.splinecode": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"ca06-NxcSwB0t0bStHgpDRYDWi2Ennv8\"",
    "mtime": "2026-08-23T05:50:23.685Z",
    "size": 51718,
    "path": "../public/spline/scene.splinecode"
  },
  "/spline/ui.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1615a-w11PnwzfhXwz3UjF1EAk3igzCsI\"",
    "mtime": "2026-08-23T05:50:23.698Z",
    "size": 90458,
    "path": "../public/spline/ui.js"
  },
  "/film/plates/hand-cutout.webp": {
    "type": "image/webp",
    "etag": "\"9210-e3SWNY48UG0lUpDMjVBwWqLn/Mc\"",
    "mtime": "2026-08-23T05:50:23.265Z",
    "size": 37392,
    "path": "../public/film/plates/hand-cutout.webp"
  },
  "/film/plates/london.webp": {
    "type": "image/webp",
    "etag": "\"9842-DZ6hIv51DA8IcsgpKv3BxngQzY4\"",
    "mtime": "2026-08-23T05:50:23.612Z",
    "size": 38978,
    "path": "../public/film/plates/london.webp"
  },
  "/film/plates/moscow.webp": {
    "type": "image/webp",
    "etag": "\"5192-OivNPOGVVVg2ZitWPkmbSpFsmpw\"",
    "mtime": "2026-08-23T05:50:23.681Z",
    "size": 20882,
    "path": "../public/film/plates/moscow.webp"
  },
  "/film/plates/mumbai.webp": {
    "type": "image/webp",
    "etag": "\"7162-HqxmOeHo4tC0WY7vzz3hE5v8hjQ\"",
    "mtime": "2026-08-23T05:50:23.677Z",
    "size": 29026,
    "path": "../public/film/plates/mumbai.webp"
  },
  "/film/plates/paris.webp": {
    "type": "image/webp",
    "etag": "\"4720-LwzJWQVT33DQ6iBXASSPEjAd13g\"",
    "mtime": "2026-08-23T05:50:23.669Z",
    "size": 18208,
    "path": "../public/film/plates/paris.webp"
  },
  "/film/plates/riyadh.webp": {
    "type": "image/webp",
    "etag": "\"89d6-pSuySV2xFNV6ZfQeFT0435IYpp4\"",
    "mtime": "2026-08-23T05:50:23.680Z",
    "size": 35286,
    "path": "../public/film/plates/riyadh.webp"
  },
  "/film/plates/shanghai.webp": {
    "type": "image/webp",
    "etag": "\"45da-MGbN/J9Og6sO4TvDhOQ7sG49uOQ\"",
    "mtime": "2026-08-23T05:50:23.681Z",
    "size": 17882,
    "path": "../public/film/plates/shanghai.webp"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-3mRojDdS0F7P8sU0eB57NdS4c3E\"",
    "mtime": "2026-08-23T05:50:23.223Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/scenes/scene-canyon.png": {
    "type": "image/png",
    "etag": "\"1b2e5a-JjaHBpGFW0m1CVBtL4zxuuhDrWg\"",
    "mtime": "2026-08-23T05:50:23.585Z",
    "size": 1781338,
    "path": "../public/scenes/scene-canyon.png"
  },
  "/film/stills/kf-02.webp": {
    "type": "image/webp",
    "etag": "\"166ca-+JxPyWgjN12XThfc7akuHBpmAeQ\"",
    "mtime": "2026-08-23T05:50:23.686Z",
    "size": 91850,
    "path": "../public/film/stills/kf-02.webp"
  },
  "/film/stills/kf-01.webp": {
    "type": "image/webp",
    "etag": "\"5bac-NHlAVpt/WcqeonITuezx3vE0EK4\"",
    "mtime": "2026-08-23T05:50:23.266Z",
    "size": 23468,
    "path": "../public/film/stills/kf-01.webp"
  },
  "/scenes/scene-lobby.png": {
    "type": "image/png",
    "etag": "\"1d5831-DS7eVox5wBeMKWdg10Djvk0edwA\"",
    "mtime": "2026-08-23T05:50:23.603Z",
    "size": 1923121,
    "path": "../public/scenes/scene-lobby.png"
  },
  "/film/stills/kf-03.webp": {
    "type": "image/webp",
    "etag": "\"81da-IKnHFFuNdPksFN74VKKj2TbKVyA\"",
    "mtime": "2026-08-23T05:50:23.690Z",
    "size": 33242,
    "path": "../public/film/stills/kf-03.webp"
  },
  "/film/stills/kf-03d.webp": {
    "type": "image/webp",
    "etag": "\"4d98-5mTeGBVNd2f7G0N/MMhGpJGn/Sw\"",
    "mtime": "2026-08-23T05:50:23.690Z",
    "size": 19864,
    "path": "../public/film/stills/kf-03d.webp"
  },
  "/spline/physics.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e5981-wQt39FQDUGxzbNkip4dz4Cyejm8\"",
    "mtime": "2026-08-23T05:50:23.665Z",
    "size": 1988993,
    "path": "../public/spline/physics.js"
  },
  "/spline/runtime.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f3c1e-y5u8C3z/W2PjhBTFtun19weiY+g\"",
    "mtime": "2026-08-23T05:50:23.678Z",
    "size": 2047006,
    "path": "../public/spline/runtime.js"
  },
  "/film/stills/kf-04.webp": {
    "type": "image/webp",
    "etag": "\"cf7a-R+lE5fb3Vawvhl8GoLwMpZv965U\"",
    "mtime": "2026-08-23T05:50:23.689Z",
    "size": 53114,
    "path": "../public/film/stills/kf-04.webp"
  },
  "/film/stills/kf-05.webp": {
    "type": "image/webp",
    "etag": "\"87c4-bh8h7GVVFoQ9uVP3vZfp+4gwQ2k\"",
    "mtime": "2026-08-23T05:50:23.693Z",
    "size": 34756,
    "path": "../public/film/stills/kf-05.webp"
  },
  "/film/stills/kf-06.webp": {
    "type": "image/webp",
    "etag": "\"7a02-H5GPjSWbJ1rbg3wksv+R0I9fbPQ\"",
    "mtime": "2026-08-23T05:50:23.693Z",
    "size": 31234,
    "path": "../public/film/stills/kf-06.webp"
  },
  "/film/stills/kf-08.webp": {
    "type": "image/webp",
    "etag": "\"2838-rWwdZr2Huh1k0dQjPIlwjrKz0c0\"",
    "mtime": "2026-08-23T05:50:23.694Z",
    "size": 10296,
    "path": "../public/film/stills/kf-08.webp"
  },
  "/film/stills/kf-07.webp": {
    "type": "image/webp",
    "etag": "\"813a-d5J1+sLj0pcEwCWO81Ca/G/qTYU\"",
    "mtime": "2026-08-23T05:50:23.695Z",
    "size": 33082,
    "path": "../public/film/stills/kf-07.webp"
  },
  "/_nuxt/builds/meta/9714f567-0306-4848-96a4-59a129f8ecd7.json": {
    "type": "application/json",
    "etag": "\"87-rJcZ7vcp8vhdv0qM+Ur6H+q4tAw\"",
    "mtime": "2026-08-23T05:50:23.220Z",
    "size": 135,
    "path": "../public/_nuxt/builds/meta/9714f567-0306-4848-96a4-59a129f8ecd7.json"
  },
  "/film/frames/transit-a/landscape/960/f_001.webp": {
    "type": "image/webp",
    "etag": "\"363a-82HjsaGsdGhFpaZ1kaP/rhLOIX0\"",
    "mtime": "2026-08-23T05:50:23.702Z",
    "size": 13882,
    "path": "../public/film/frames/transit-a/landscape/960/f_001.webp"
  },
  "/film/frames/transit-a/landscape/960/f_002.webp": {
    "type": "image/webp",
    "etag": "\"36ac-FjTibbLdyopocsPSVKEuAzlwL4M\"",
    "mtime": "2026-08-23T05:50:23.710Z",
    "size": 13996,
    "path": "../public/film/frames/transit-a/landscape/960/f_002.webp"
  },
  "/film/frames/transit-a/landscape/960/f_003.webp": {
    "type": "image/webp",
    "etag": "\"3692-nqcKj5vS2OY1wGTUcXkxLA8QlwI\"",
    "mtime": "2026-08-23T05:50:23.714Z",
    "size": 13970,
    "path": "../public/film/frames/transit-a/landscape/960/f_003.webp"
  },
  "/film/frames/transit-a/landscape/960/f_004.webp": {
    "type": "image/webp",
    "etag": "\"3728-6ItLEsUYzvI61mZUVTiIa0uIj1Y\"",
    "mtime": "2026-08-23T05:50:23.712Z",
    "size": 14120,
    "path": "../public/film/frames/transit-a/landscape/960/f_004.webp"
  },
  "/film/frames/transit-a/landscape/960/f_005.webp": {
    "type": "image/webp",
    "etag": "\"3698-rlrF+GXnWlfke85ZNTDn+L2DIrM\"",
    "mtime": "2026-08-23T05:50:23.714Z",
    "size": 13976,
    "path": "../public/film/frames/transit-a/landscape/960/f_005.webp"
  },
  "/film/frames/transit-a/landscape/960/f_006.webp": {
    "type": "image/webp",
    "etag": "\"3636-fJcuUJZWmicHYgks+7CR+5Z4aSM\"",
    "mtime": "2026-08-23T05:50:23.715Z",
    "size": 13878,
    "path": "../public/film/frames/transit-a/landscape/960/f_006.webp"
  },
  "/film/frames/transit-a/landscape/960/f_007.webp": {
    "type": "image/webp",
    "etag": "\"3756-/9Ts+urmQ3RyjSexeFrzYTldETc\"",
    "mtime": "2026-08-23T05:50:23.716Z",
    "size": 14166,
    "path": "../public/film/frames/transit-a/landscape/960/f_007.webp"
  },
  "/film/frames/transit-a/landscape/960/f_008.webp": {
    "type": "image/webp",
    "etag": "\"370a-oiG5tl22fU1sPP23m5W3ZKfso1k\"",
    "mtime": "2026-08-23T05:50:23.715Z",
    "size": 14090,
    "path": "../public/film/frames/transit-a/landscape/960/f_008.webp"
  },
  "/film/frames/transit-a/landscape/960/f_009.webp": {
    "type": "image/webp",
    "etag": "\"36e2-rENeHM8rejm5AQSyIiPic1arRG4\"",
    "mtime": "2026-08-23T05:50:23.726Z",
    "size": 14050,
    "path": "../public/film/frames/transit-a/landscape/960/f_009.webp"
  },
  "/film/frames/transit-a/landscape/960/f_010.webp": {
    "type": "image/webp",
    "etag": "\"365c-vEmYj/TjhlQYqi+MTkSUHQ1xI+4\"",
    "mtime": "2026-08-23T05:50:23.717Z",
    "size": 13916,
    "path": "../public/film/frames/transit-a/landscape/960/f_010.webp"
  },
  "/film/frames/transit-a/landscape/960/f_011.webp": {
    "type": "image/webp",
    "etag": "\"3872-SN1quNxQ11n0OUwf6cJNQO+x7Y8\"",
    "mtime": "2026-08-23T05:50:23.716Z",
    "size": 14450,
    "path": "../public/film/frames/transit-a/landscape/960/f_011.webp"
  },
  "/film/frames/transit-a/landscape/960/f_012.webp": {
    "type": "image/webp",
    "etag": "\"382c-kFZCRehZq9qA3dhl9OwEk4xzEr8\"",
    "mtime": "2026-08-23T05:50:23.718Z",
    "size": 14380,
    "path": "../public/film/frames/transit-a/landscape/960/f_012.webp"
  },
  "/film/frames/transit-a/landscape/960/f_013.webp": {
    "type": "image/webp",
    "etag": "\"37bc-ioo9GsLlti2JKHlvQsH/woCLVh0\"",
    "mtime": "2026-08-23T05:50:23.719Z",
    "size": 14268,
    "path": "../public/film/frames/transit-a/landscape/960/f_013.webp"
  },
  "/film/frames/transit-a/landscape/960/f_014.webp": {
    "type": "image/webp",
    "etag": "\"37c6-pp2oW7UQJHjo+sQFYrVKMMnmNpc\"",
    "mtime": "2026-08-23T05:50:23.719Z",
    "size": 14278,
    "path": "../public/film/frames/transit-a/landscape/960/f_014.webp"
  },
  "/film/frames/transit-a/landscape/960/f_015.webp": {
    "type": "image/webp",
    "etag": "\"39de-ahFKqNO13+2V0unAlxQ7+wl8QVc\"",
    "mtime": "2026-08-23T05:50:23.721Z",
    "size": 14814,
    "path": "../public/film/frames/transit-a/landscape/960/f_015.webp"
  },
  "/film/frames/transit-a/landscape/960/f_016.webp": {
    "type": "image/webp",
    "etag": "\"3902-DOdUEDyEjmK93zRnELFNEljfWb0\"",
    "mtime": "2026-08-23T05:50:23.721Z",
    "size": 14594,
    "path": "../public/film/frames/transit-a/landscape/960/f_016.webp"
  },
  "/film/frames/transit-a/landscape/960/f_017.webp": {
    "type": "image/webp",
    "etag": "\"39c0-NVEnrr2BP3pzc8/yBYjVAJnUvHk\"",
    "mtime": "2026-08-23T05:50:23.722Z",
    "size": 14784,
    "path": "../public/film/frames/transit-a/landscape/960/f_017.webp"
  },
  "/film/frames/transit-a/landscape/960/f_018.webp": {
    "type": "image/webp",
    "etag": "\"3a32-P1i7zuUmC7Hu6P9TyLsnHu91yCo\"",
    "mtime": "2026-08-23T05:50:23.722Z",
    "size": 14898,
    "path": "../public/film/frames/transit-a/landscape/960/f_018.webp"
  },
  "/film/frames/transit-a/landscape/960/f_019.webp": {
    "type": "image/webp",
    "etag": "\"3d7a-ntym+/yOBlOq74bdSVTmB6jA0kQ\"",
    "mtime": "2026-08-23T05:50:23.723Z",
    "size": 15738,
    "path": "../public/film/frames/transit-a/landscape/960/f_019.webp"
  },
  "/film/frames/transit-a/landscape/960/f_020.webp": {
    "type": "image/webp",
    "etag": "\"3cd6-lL5Xl6O99pNPUPuoOfIv7/kgvMc\"",
    "mtime": "2026-08-23T05:50:23.725Z",
    "size": 15574,
    "path": "../public/film/frames/transit-a/landscape/960/f_020.webp"
  },
  "/film/frames/transit-a/landscape/960/f_021.webp": {
    "type": "image/webp",
    "etag": "\"3ee4-aHPnLjfR9pa581vYh1dlEzxKp0o\"",
    "mtime": "2026-08-23T05:50:23.723Z",
    "size": 16100,
    "path": "../public/film/frames/transit-a/landscape/960/f_021.webp"
  },
  "/film/frames/transit-a/landscape/960/f_022.webp": {
    "type": "image/webp",
    "etag": "\"3fec-0HS6gm3YbpcKW4k/g3NBfRqXD7c\"",
    "mtime": "2026-08-23T05:50:23.739Z",
    "size": 16364,
    "path": "../public/film/frames/transit-a/landscape/960/f_022.webp"
  },
  "/film/frames/transit-a/landscape/960/f_023.webp": {
    "type": "image/webp",
    "etag": "\"446a-03XoFh01JRnkMq8ZW9/jefHXD50\"",
    "mtime": "2026-08-23T05:50:23.727Z",
    "size": 17514,
    "path": "../public/film/frames/transit-a/landscape/960/f_023.webp"
  },
  "/film/frames/transit-a/landscape/960/f_024.webp": {
    "type": "image/webp",
    "etag": "\"445a-qFPs7k6lc8Rebzn/9MbG5ztE3fE\"",
    "mtime": "2026-08-23T05:50:23.730Z",
    "size": 17498,
    "path": "../public/film/frames/transit-a/landscape/960/f_024.webp"
  },
  "/film/frames/transit-a/landscape/960/f_025.webp": {
    "type": "image/webp",
    "etag": "\"454a-kvISTE0plrcMlC/17tCzwcL8HtA\"",
    "mtime": "2026-08-23T05:50:23.725Z",
    "size": 17738,
    "path": "../public/film/frames/transit-a/landscape/960/f_025.webp"
  },
  "/film/frames/transit-a/landscape/960/f_026.webp": {
    "type": "image/webp",
    "etag": "\"4624-YVJEWMKLkTsmWq2YrPfPgO7F4tA\"",
    "mtime": "2026-08-23T05:50:23.730Z",
    "size": 17956,
    "path": "../public/film/frames/transit-a/landscape/960/f_026.webp"
  },
  "/film/frames/transit-a/landscape/960/f_027.webp": {
    "type": "image/webp",
    "etag": "\"4a04-XIf6b76W82X/ksVRAnixw0dp89o\"",
    "mtime": "2026-08-23T05:50:23.732Z",
    "size": 18948,
    "path": "../public/film/frames/transit-a/landscape/960/f_027.webp"
  },
  "/film/frames/transit-a/landscape/960/f_028.webp": {
    "type": "image/webp",
    "etag": "\"4a4e-KxuV+alIaEif8R468QS9pxk9f3g\"",
    "mtime": "2026-08-23T05:50:23.741Z",
    "size": 19022,
    "path": "../public/film/frames/transit-a/landscape/960/f_028.webp"
  },
  "/film/frames/transit-a/landscape/960/f_029.webp": {
    "type": "image/webp",
    "etag": "\"4c8e-smNEAfCvdYG5jaRsSjqLpBllMhY\"",
    "mtime": "2026-08-23T05:50:23.739Z",
    "size": 19598,
    "path": "../public/film/frames/transit-a/landscape/960/f_029.webp"
  },
  "/film/frames/transit-a/landscape/960/f_030.webp": {
    "type": "image/webp",
    "etag": "\"4eb0-4ljV1omilkDCi8oF+OhgO3cjPJs\"",
    "mtime": "2026-08-23T05:50:23.732Z",
    "size": 20144,
    "path": "../public/film/frames/transit-a/landscape/960/f_030.webp"
  },
  "/film/frames/transit-a/landscape/960/f_031.webp": {
    "type": "image/webp",
    "etag": "\"541a-AcbZvr3LOkjmVIoAInmJGdsw1qs\"",
    "mtime": "2026-08-23T05:50:23.737Z",
    "size": 21530,
    "path": "../public/film/frames/transit-a/landscape/960/f_031.webp"
  },
  "/film/frames/transit-a/landscape/960/f_032.webp": {
    "type": "image/webp",
    "etag": "\"517a-w0ngvPqUwChSUzTLI9mQGUxQQVA\"",
    "mtime": "2026-08-23T05:50:23.737Z",
    "size": 20858,
    "path": "../public/film/frames/transit-a/landscape/960/f_032.webp"
  },
  "/film/frames/transit-a/landscape/960/f_033.webp": {
    "type": "image/webp",
    "etag": "\"5284-qN1SbqpQ9xy/y7EwxE9fSN44XTM\"",
    "mtime": "2026-08-23T05:50:23.741Z",
    "size": 21124,
    "path": "../public/film/frames/transit-a/landscape/960/f_033.webp"
  },
  "/film/frames/transit-a/landscape/960/f_034.webp": {
    "type": "image/webp",
    "etag": "\"53a6-37EPpMI6dVVWxFVlLPcUzTOoY+Q\"",
    "mtime": "2026-08-23T05:50:23.739Z",
    "size": 21414,
    "path": "../public/film/frames/transit-a/landscape/960/f_034.webp"
  },
  "/film/frames/transit-a/landscape/960/f_035.webp": {
    "type": "image/webp",
    "etag": "\"5930-Q4cUlURskK5co5QBBLN0N2/LE98\"",
    "mtime": "2026-08-23T05:50:23.743Z",
    "size": 22832,
    "path": "../public/film/frames/transit-a/landscape/960/f_035.webp"
  },
  "/film/frames/transit-a/landscape/960/f_036.webp": {
    "type": "image/webp",
    "etag": "\"5524-DUijLxAN+ATUj/n1KqHkVRxbY0g\"",
    "mtime": "2026-08-23T05:50:23.743Z",
    "size": 21796,
    "path": "../public/film/frames/transit-a/landscape/960/f_036.webp"
  },
  "/film/frames/transit-a/landscape/960/f_037.webp": {
    "type": "image/webp",
    "etag": "\"5460-fylQE0P+wulaiu1YGg6oXzk5tIg\"",
    "mtime": "2026-08-23T05:50:23.746Z",
    "size": 21600,
    "path": "../public/film/frames/transit-a/landscape/960/f_037.webp"
  },
  "/film/frames/transit-a/landscape/960/f_038.webp": {
    "type": "image/webp",
    "etag": "\"554c-7s61qlzYFSaCYkE1a5ZxHigH2Kk\"",
    "mtime": "2026-08-23T05:50:23.747Z",
    "size": 21836,
    "path": "../public/film/frames/transit-a/landscape/960/f_038.webp"
  },
  "/film/frames/transit-a/landscape/960/f_039.webp": {
    "type": "image/webp",
    "etag": "\"5900-vrtG7m6wvdJ+ZypzGPS6MK2tjpc\"",
    "mtime": "2026-08-23T05:50:23.746Z",
    "size": 22784,
    "path": "../public/film/frames/transit-a/landscape/960/f_039.webp"
  },
  "/film/frames/transit-a/landscape/960/f_040.webp": {
    "type": "image/webp",
    "etag": "\"5466-jGzg8cg3XEcQ5AJQ7jN4yuH80P4\"",
    "mtime": "2026-08-23T05:50:23.750Z",
    "size": 21606,
    "path": "../public/film/frames/transit-a/landscape/960/f_040.webp"
  },
  "/film/frames/transit-a/landscape/960/f_041.webp": {
    "type": "image/webp",
    "etag": "\"52c6-ehpjF47XkI2GnUUon7KyeraXsKk\"",
    "mtime": "2026-08-23T05:50:23.751Z",
    "size": 21190,
    "path": "../public/film/frames/transit-a/landscape/960/f_041.webp"
  },
  "/film/frames/transit-a/landscape/960/f_042.webp": {
    "type": "image/webp",
    "etag": "\"4f66-0Fi62vkvpksODXIRIt4V5szRzuY\"",
    "mtime": "2026-08-23T05:50:23.748Z",
    "size": 20326,
    "path": "../public/film/frames/transit-a/landscape/960/f_042.webp"
  },
  "/film/frames/transit-a/landscape/960/f_043.webp": {
    "type": "image/webp",
    "etag": "\"5208-uQ2o069JKKEdjzU83hDd5q/dZm0\"",
    "mtime": "2026-08-23T05:50:23.753Z",
    "size": 21000,
    "path": "../public/film/frames/transit-a/landscape/960/f_043.webp"
  },
  "/film/frames/transit-a/landscape/960/f_044.webp": {
    "type": "image/webp",
    "etag": "\"48fa-sb+6cEY3+edv7urrn9LKew92mQo\"",
    "mtime": "2026-08-23T05:50:23.750Z",
    "size": 18682,
    "path": "../public/film/frames/transit-a/landscape/960/f_044.webp"
  },
  "/film/frames/transit-a/landscape/960/f_045.webp": {
    "type": "image/webp",
    "etag": "\"48a2-lFStsz067aYJZ8LHsuRCzBOlUdw\"",
    "mtime": "2026-08-23T05:50:23.752Z",
    "size": 18594,
    "path": "../public/film/frames/transit-a/landscape/960/f_045.webp"
  },
  "/film/frames/transit-a/landscape/960/f_046.webp": {
    "type": "image/webp",
    "etag": "\"4ad2-4NpbV89onZSOMtEvs85Alj33qlA\"",
    "mtime": "2026-08-23T05:50:23.752Z",
    "size": 19154,
    "path": "../public/film/frames/transit-a/landscape/960/f_046.webp"
  },
  "/film/frames/transit-a/landscape/960/f_047.webp": {
    "type": "image/webp",
    "etag": "\"50ce-JMQ1Z2s+LoziIyMG3FDDf4JMvsE\"",
    "mtime": "2026-08-23T05:50:23.757Z",
    "size": 20686,
    "path": "../public/film/frames/transit-a/landscape/960/f_047.webp"
  },
  "/film/frames/transit-a/landscape/960/f_048.webp": {
    "type": "image/webp",
    "etag": "\"4de4-USHAiDuVtWVUgDsBqPs5w/ldOUI\"",
    "mtime": "2026-08-23T05:50:23.754Z",
    "size": 19940,
    "path": "../public/film/frames/transit-a/landscape/960/f_048.webp"
  },
  "/film/frames/transit-a/landscape/960/f_049.webp": {
    "type": "image/webp",
    "etag": "\"4f8a-wTHo7rP8rQAz28WPP25WBJrO1ZE\"",
    "mtime": "2026-08-23T05:50:23.756Z",
    "size": 20362,
    "path": "../public/film/frames/transit-a/landscape/960/f_049.webp"
  },
  "/film/frames/transit-a/landscape/960/f_050.webp": {
    "type": "image/webp",
    "etag": "\"4f90-PamJmuhtsjhebRfiWseUJium6SY\"",
    "mtime": "2026-08-23T05:50:23.755Z",
    "size": 20368,
    "path": "../public/film/frames/transit-a/landscape/960/f_050.webp"
  },
  "/film/frames/transit-a/landscape/960/f_051.webp": {
    "type": "image/webp",
    "etag": "\"54bc-hQaoKMOVtnU2qKsn0iRuW71j63c\"",
    "mtime": "2026-08-23T05:50:23.758Z",
    "size": 21692,
    "path": "../public/film/frames/transit-a/landscape/960/f_051.webp"
  },
  "/film/frames/transit-a/landscape/960/f_053.webp": {
    "type": "image/webp",
    "etag": "\"5126-pvjDqUtH6GVHKyMc32oN0BenaQI\"",
    "mtime": "2026-08-23T05:50:23.763Z",
    "size": 20774,
    "path": "../public/film/frames/transit-a/landscape/960/f_053.webp"
  },
  "/scenes/background.png": {
    "type": "image/png",
    "etag": "\"77f68c-V4m0di0Y6cBrkXuwOV8V/Qq1xWY\"",
    "mtime": "2026-08-23T05:50:23.434Z",
    "size": 7861900,
    "path": "../public/scenes/background.png"
  },
  "/film/frames/transit-a/landscape/960/f_052.webp": {
    "type": "image/webp",
    "etag": "\"50f6-EAcALiikj/3LEB2o5SO0oLdHOB8\"",
    "mtime": "2026-08-23T05:50:23.767Z",
    "size": 20726,
    "path": "../public/film/frames/transit-a/landscape/960/f_052.webp"
  },
  "/film/frames/transit-a/landscape/960/f_054.webp": {
    "type": "image/webp",
    "etag": "\"5086-2o0bpGylkuOTHSUSA10AXD0pBcY\"",
    "mtime": "2026-08-23T05:50:23.769Z",
    "size": 20614,
    "path": "../public/film/frames/transit-a/landscape/960/f_054.webp"
  },
  "/film/frames/transit-a/landscape/960/f_055.webp": {
    "type": "image/webp",
    "etag": "\"527e-oqJTCQYsZLhtGsAxJmPHbX+hMEc\"",
    "mtime": "2026-08-23T05:50:23.760Z",
    "size": 21118,
    "path": "../public/film/frames/transit-a/landscape/960/f_055.webp"
  },
  "/film/frames/transit-a/landscape/960/f_056.webp": {
    "type": "image/webp",
    "etag": "\"5114-9lSbFEG7HCUJKtEt+CLSWlUzFYM\"",
    "mtime": "2026-08-23T05:50:23.763Z",
    "size": 20756,
    "path": "../public/film/frames/transit-a/landscape/960/f_056.webp"
  },
  "/film/frames/transit-a/landscape/960/f_057.webp": {
    "type": "image/webp",
    "etag": "\"5208-venugbcvdLfPxez8X/MR1ey3hnA\"",
    "mtime": "2026-08-23T05:50:23.772Z",
    "size": 21000,
    "path": "../public/film/frames/transit-a/landscape/960/f_057.webp"
  },
  "/film/frames/transit-a/landscape/960/f_059.webp": {
    "type": "image/webp",
    "etag": "\"55ee-rNYfOGS54v++QUiYvBExmKuv9zQ\"",
    "mtime": "2026-08-23T05:50:23.767Z",
    "size": 21998,
    "path": "../public/film/frames/transit-a/landscape/960/f_059.webp"
  },
  "/film/frames/transit-a/landscape/960/f_058.webp": {
    "type": "image/webp",
    "etag": "\"52c8-DP7y8rxEpUJAx0ShRn327eP55tc\"",
    "mtime": "2026-08-23T05:50:23.770Z",
    "size": 21192,
    "path": "../public/film/frames/transit-a/landscape/960/f_058.webp"
  },
  "/film/frames/transit-a/landscape/960/f_060.webp": {
    "type": "image/webp",
    "etag": "\"53b2-fI6g0mrO9GBC4bA3l83PUsQ2n3w\"",
    "mtime": "2026-08-23T05:50:23.772Z",
    "size": 21426,
    "path": "../public/film/frames/transit-a/landscape/960/f_060.webp"
  },
  "/film/frames/transit-a/landscape/960/f_061.webp": {
    "type": "image/webp",
    "etag": "\"52de-ZWrFNIteUayVLMJqxl23pyTlNrA\"",
    "mtime": "2026-08-23T05:50:23.779Z",
    "size": 21214,
    "path": "../public/film/frames/transit-a/landscape/960/f_061.webp"
  },
  "/film/frames/transit-a/landscape/960/f_062.webp": {
    "type": "image/webp",
    "etag": "\"540c-Xxkzy2KNkl/Valme0G0ohFuDyKA\"",
    "mtime": "2026-08-23T05:50:23.774Z",
    "size": 21516,
    "path": "../public/film/frames/transit-a/landscape/960/f_062.webp"
  },
  "/film/frames/transit-a/landscape/960/f_063.webp": {
    "type": "image/webp",
    "etag": "\"57d4-Gmt6HK8igCfLaYyeW03HFArrCJI\"",
    "mtime": "2026-08-23T05:50:23.774Z",
    "size": 22484,
    "path": "../public/film/frames/transit-a/landscape/960/f_063.webp"
  },
  "/film/frames/transit-a/landscape/960/f_064.webp": {
    "type": "image/webp",
    "etag": "\"550a-YX7rfenSkoNBOvVfDRSYcfVMmjk\"",
    "mtime": "2026-08-23T05:50:23.779Z",
    "size": 21770,
    "path": "../public/film/frames/transit-a/landscape/960/f_064.webp"
  },
  "/film/frames/transit-a/landscape/960/f_065.webp": {
    "type": "image/webp",
    "etag": "\"546a-Io9edac2A7wuDKLlvrZHpT8nM/I\"",
    "mtime": "2026-08-23T05:50:23.776Z",
    "size": 21610,
    "path": "../public/film/frames/transit-a/landscape/960/f_065.webp"
  },
  "/film/frames/transit-a/landscape/960/f_066.webp": {
    "type": "image/webp",
    "etag": "\"54b8-c7GP/AWrw7WdY9IH6Dzqk15HY4Y\"",
    "mtime": "2026-08-23T05:50:23.778Z",
    "size": 21688,
    "path": "../public/film/frames/transit-a/landscape/960/f_066.webp"
  },
  "/film/frames/transit-a/landscape/960/f_067.webp": {
    "type": "image/webp",
    "etag": "\"55c6-Glj7ugx2mUrBNKft6ECDIaSS/LU\"",
    "mtime": "2026-08-23T05:50:23.777Z",
    "size": 21958,
    "path": "../public/film/frames/transit-a/landscape/960/f_067.webp"
  },
  "/film/frames/transit-a/landscape/960/f_068.webp": {
    "type": "image/webp",
    "etag": "\"52de-Dm3xxnyOyYQ3IU7gxHzz1sfDtSU\"",
    "mtime": "2026-08-23T05:50:23.778Z",
    "size": 21214,
    "path": "../public/film/frames/transit-a/landscape/960/f_068.webp"
  },
  "/film/frames/transit-a/landscape/960/f_069.webp": {
    "type": "image/webp",
    "etag": "\"5266-Pdn7MH0gZHpbj1l1Z1eKKKkBP3U\"",
    "mtime": "2026-08-23T05:50:23.783Z",
    "size": 21094,
    "path": "../public/film/frames/transit-a/landscape/960/f_069.webp"
  },
  "/film/frames/transit-a/landscape/960/f_070.webp": {
    "type": "image/webp",
    "etag": "\"523e-uIrfLtlYrT4jXrdQrf5DT4tIrTc\"",
    "mtime": "2026-08-23T05:50:23.783Z",
    "size": 21054,
    "path": "../public/film/frames/transit-a/landscape/960/f_070.webp"
  },
  "/film/frames/transit-a/landscape/960/f_071.webp": {
    "type": "image/webp",
    "etag": "\"546a-lCArc/E8z0OTqNPfBL7As4xAvkk\"",
    "mtime": "2026-08-23T05:50:23.790Z",
    "size": 21610,
    "path": "../public/film/frames/transit-a/landscape/960/f_071.webp"
  },
  "/film/frames/transit-a/landscape/960/f_072.webp": {
    "type": "image/webp",
    "etag": "\"53e4-RpvcMLAIiI/NgB1OLRtgScNL8Ak\"",
    "mtime": "2026-08-23T05:50:23.784Z",
    "size": 21476,
    "path": "../public/film/frames/transit-a/landscape/960/f_072.webp"
  },
  "/film/frames/transit-a/landscape/960/f_073.webp": {
    "type": "image/webp",
    "etag": "\"53f6-o7TAzz7Z9VR1OLfTzmRz2jpIVCQ\"",
    "mtime": "2026-08-23T05:50:23.798Z",
    "size": 21494,
    "path": "../public/film/frames/transit-a/landscape/960/f_073.webp"
  },
  "/film/frames/transit-a/landscape/960/f_074.webp": {
    "type": "image/webp",
    "etag": "\"52d0-ojDHHRJ4SN18EvoJc1H7+EuYPgI\"",
    "mtime": "2026-08-23T05:50:23.784Z",
    "size": 21200,
    "path": "../public/film/frames/transit-a/landscape/960/f_074.webp"
  },
  "/film/frames/transit-a/landscape/960/f_075.webp": {
    "type": "image/webp",
    "etag": "\"5530-z+bPxGjRFTU4kbUfiFoEtDEfzfk\"",
    "mtime": "2026-08-23T05:50:23.788Z",
    "size": 21808,
    "path": "../public/film/frames/transit-a/landscape/960/f_075.webp"
  },
  "/film/frames/transit-a/landscape/960/f_076.webp": {
    "type": "image/webp",
    "etag": "\"53bc-5N5fnXZengjZxXL1tTee84d5phA\"",
    "mtime": "2026-08-23T05:50:23.788Z",
    "size": 21436,
    "path": "../public/film/frames/transit-a/landscape/960/f_076.webp"
  },
  "/film/frames/transit-a/landscape/960/f_077.webp": {
    "type": "image/webp",
    "etag": "\"5338-YfpNs0ObxNPwXIKfFrmGb5mEuC0\"",
    "mtime": "2026-08-23T05:50:23.790Z",
    "size": 21304,
    "path": "../public/film/frames/transit-a/landscape/960/f_077.webp"
  },
  "/film/frames/transit-a/landscape/960/f_078.webp": {
    "type": "image/webp",
    "etag": "\"525c-jALlwMv9f7aIaBjigLlzu3cxsU8\"",
    "mtime": "2026-08-23T05:50:23.793Z",
    "size": 21084,
    "path": "../public/film/frames/transit-a/landscape/960/f_078.webp"
  },
  "/film/frames/transit-a/landscape/960/f_079.webp": {
    "type": "image/webp",
    "etag": "\"5312-l5M2G+xEzqyXwwbq9wANefww0IE\"",
    "mtime": "2026-08-23T05:50:23.794Z",
    "size": 21266,
    "path": "../public/film/frames/transit-a/landscape/960/f_079.webp"
  },
  "/film/frames/transit-a/landscape/960/f_080.webp": {
    "type": "image/webp",
    "etag": "\"523a-S6NdoUz6hKnLZs/8dQ1VYhYQ9Z8\"",
    "mtime": "2026-08-23T05:50:23.793Z",
    "size": 21050,
    "path": "../public/film/frames/transit-a/landscape/960/f_080.webp"
  },
  "/film/frames/transit-a/landscape/960/f_081.webp": {
    "type": "image/webp",
    "etag": "\"536a-HtDR24idCMHqsRfADuEAMHK2G30\"",
    "mtime": "2026-08-23T05:50:23.799Z",
    "size": 21354,
    "path": "../public/film/frames/transit-a/landscape/960/f_081.webp"
  },
  "/film/frames/transit-a/landscape/960/f_083.webp": {
    "type": "image/webp",
    "etag": "\"5566-5nwEf22mpcP6IbAyuIwyT84XGo8\"",
    "mtime": "2026-08-23T05:50:23.801Z",
    "size": 21862,
    "path": "../public/film/frames/transit-a/landscape/960/f_083.webp"
  },
  "/film/frames/transit-a/landscape/960/f_084.webp": {
    "type": "image/webp",
    "etag": "\"5532-e5ErzMwPJoEI5e0eBfwi12hHLro\"",
    "mtime": "2026-08-23T05:50:23.799Z",
    "size": 21810,
    "path": "../public/film/frames/transit-a/landscape/960/f_084.webp"
  },
  "/film/frames/transit-a/landscape/960/f_085.webp": {
    "type": "image/webp",
    "etag": "\"54ba-kKk9nFjaT/KpiUphQ4W7YoOrINA\"",
    "mtime": "2026-08-23T05:50:23.802Z",
    "size": 21690,
    "path": "../public/film/frames/transit-a/landscape/960/f_085.webp"
  },
  "/film/frames/transit-a/landscape/960/f_082.webp": {
    "type": "image/webp",
    "etag": "\"52d8-hcVHHwF4iCHp0nPcZnGwPGeLTj8\"",
    "mtime": "2026-08-23T05:50:23.797Z",
    "size": 21208,
    "path": "../public/film/frames/transit-a/landscape/960/f_082.webp"
  },
  "/film/frames/transit-a/landscape/960/f_086.webp": {
    "type": "image/webp",
    "etag": "\"5552-q+E03o9wP6kN9Cq+B7+p0bLwnP0\"",
    "mtime": "2026-08-23T05:50:23.800Z",
    "size": 21842,
    "path": "../public/film/frames/transit-a/landscape/960/f_086.webp"
  },
  "/film/frames/transit-a/landscape/960/f_087.webp": {
    "type": "image/webp",
    "etag": "\"5608-DB8qkS0yizjOS5YtehSoR94pKKk\"",
    "mtime": "2026-08-23T05:50:23.801Z",
    "size": 22024,
    "path": "../public/film/frames/transit-a/landscape/960/f_087.webp"
  },
  "/film/frames/transit-a/landscape/960/f_088.webp": {
    "type": "image/webp",
    "etag": "\"573e-RmQezPFqkyuExdWF5NWdZd7lFZc\"",
    "mtime": "2026-08-23T05:50:23.803Z",
    "size": 22334,
    "path": "../public/film/frames/transit-a/landscape/960/f_088.webp"
  },
  "/film/frames/transit-a/landscape/960/f_089.webp": {
    "type": "image/webp",
    "etag": "\"578e-Yvw68RPjNxmxEVw9kPWL3TYy61I\"",
    "mtime": "2026-08-23T05:50:23.804Z",
    "size": 22414,
    "path": "../public/film/frames/transit-a/landscape/960/f_089.webp"
  },
  "/film/frames/transit-a/landscape/960/f_091.webp": {
    "type": "image/webp",
    "etag": "\"570c-mmDkJt5pGe18ssBoi8yYADORyZ0\"",
    "mtime": "2026-08-23T05:50:23.805Z",
    "size": 22284,
    "path": "../public/film/frames/transit-a/landscape/960/f_091.webp"
  },
  "/film/frames/transit-a/landscape/960/f_090.webp": {
    "type": "image/webp",
    "etag": "\"57b6-Dx1wz6UTwm5M6mNRjF/gH12Ui70\"",
    "mtime": "2026-08-23T05:50:23.806Z",
    "size": 22454,
    "path": "../public/film/frames/transit-a/landscape/960/f_090.webp"
  },
  "/film/frames/transit-a/landscape/960/f_092.webp": {
    "type": "image/webp",
    "etag": "\"56ec-vXNewQcL+VEisXw/hwmb0sOa3EQ\"",
    "mtime": "2026-08-23T05:50:23.808Z",
    "size": 22252,
    "path": "../public/film/frames/transit-a/landscape/960/f_092.webp"
  },
  "/film/frames/transit-a/landscape/960/f_093.webp": {
    "type": "image/webp",
    "etag": "\"586c-PlOtBY9gVHHxXUQx+mUUByUOJ5U\"",
    "mtime": "2026-08-23T05:50:23.804Z",
    "size": 22636,
    "path": "../public/film/frames/transit-a/landscape/960/f_093.webp"
  },
  "/film/frames/transit-a/landscape/960/f_094.webp": {
    "type": "image/webp",
    "etag": "\"58b2-U09DTKfD/1/ip9waoBZOIDHYv1w\"",
    "mtime": "2026-08-23T05:50:23.821Z",
    "size": 22706,
    "path": "../public/film/frames/transit-a/landscape/960/f_094.webp"
  },
  "/film/frames/transit-a/landscape/960/f_095.webp": {
    "type": "image/webp",
    "etag": "\"5862-O/shxedaL7lR7GF4SDlCyLMqcOg\"",
    "mtime": "2026-08-23T05:50:23.805Z",
    "size": 22626,
    "path": "../public/film/frames/transit-a/landscape/960/f_095.webp"
  },
  "/film/frames/transit-a/landscape/960/f_096.webp": {
    "type": "image/webp",
    "etag": "\"5852-tj9YKZMmhqDhfnhWKcaoghUm4mQ\"",
    "mtime": "2026-08-23T05:50:23.806Z",
    "size": 22610,
    "path": "../public/film/frames/transit-a/landscape/960/f_096.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_001.webp": {
    "type": "image/webp",
    "etag": "\"386ea-kuqT4u43cGOCoqctsF/FxWQKqJU\"",
    "mtime": "2026-08-23T05:50:23.712Z",
    "size": 231146,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_001.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_002.webp": {
    "type": "image/webp",
    "etag": "\"4036e-tZIqngLhBBAEeovv9dgl63fOG3Q\"",
    "mtime": "2026-08-23T05:50:23.819Z",
    "size": 263022,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_002.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_003.webp": {
    "type": "image/webp",
    "etag": "\"40096-07mA9UCqSfCk2+6JzCqFpAOilo4\"",
    "mtime": "2026-08-23T05:50:23.818Z",
    "size": 262294,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_003.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_004.webp": {
    "type": "image/webp",
    "etag": "\"43892-ur1iB0z0L6goGcAOKnLECzYu7iE\"",
    "mtime": "2026-08-23T05:50:23.831Z",
    "size": 276626,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_004.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_005.webp": {
    "type": "image/webp",
    "etag": "\"44d36-PUwnlStUaroJS3vYoncA80xXSaI\"",
    "mtime": "2026-08-23T05:50:23.867Z",
    "size": 281910,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_005.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_007.webp": {
    "type": "image/webp",
    "etag": "\"4717a-s+qMtDuqXWrwbAIThxvSDzYVeW0\"",
    "mtime": "2026-08-23T05:50:23.839Z",
    "size": 291194,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_007.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_009.webp": {
    "type": "image/webp",
    "etag": "\"47784-Pu/xesHxz4mF/Ljuf7wuTqh9tcI\"",
    "mtime": "2026-08-23T05:50:23.852Z",
    "size": 292740,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_009.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_008.webp": {
    "type": "image/webp",
    "etag": "\"470a4-hYaT0XIRS31/duKxTcss0NWpwiY\"",
    "mtime": "2026-08-23T05:50:23.841Z",
    "size": 290980,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_008.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_006.webp": {
    "type": "image/webp",
    "etag": "\"461f8-htfPeX/LKDlkPgs79fGYo8+IhX0\"",
    "mtime": "2026-08-23T05:50:23.831Z",
    "size": 287224,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_006.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_010.webp": {
    "type": "image/webp",
    "etag": "\"476da-lGrR1tB5BBLyH8J2KpmURwkFCSk\"",
    "mtime": "2026-08-23T05:50:23.855Z",
    "size": 292570,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_010.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_012.webp": {
    "type": "image/webp",
    "etag": "\"47980-GIQYEDE4wcQ7VIUsw73q2+y7rEc\"",
    "mtime": "2026-08-23T05:50:23.883Z",
    "size": 293248,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_012.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_011.webp": {
    "type": "image/webp",
    "etag": "\"4718e-R/ngurVkvigw9CTJpQoHBlJxTT0\"",
    "mtime": "2026-08-23T05:50:23.867Z",
    "size": 291214,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_011.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_013.webp": {
    "type": "image/webp",
    "etag": "\"47048-bbkYn9r9vlesnwf7RPDfXldQwlk\"",
    "mtime": "2026-08-23T05:50:23.908Z",
    "size": 290888,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_013.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_014.webp": {
    "type": "image/webp",
    "etag": "\"46f7e-F6EvBVHV1bzDyBkPcmiivj6u82k\"",
    "mtime": "2026-08-23T05:50:23.883Z",
    "size": 290686,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_014.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_017.webp": {
    "type": "image/webp",
    "etag": "\"45cfe-MUAS+ha/aWMo3u54aH3m6c+BS+A\"",
    "mtime": "2026-08-23T05:50:23.896Z",
    "size": 285950,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_017.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_016.webp": {
    "type": "image/webp",
    "etag": "\"45aca-hWN0Ys5f5TPcVhz03DXTvYpoFxs\"",
    "mtime": "2026-08-23T05:50:23.919Z",
    "size": 285386,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_016.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_015.webp": {
    "type": "image/webp",
    "etag": "\"460e4-EEE9coY1ltfyMlw4idwZLVtOL1s\"",
    "mtime": "2026-08-23T05:50:23.895Z",
    "size": 286948,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_015.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_019.webp": {
    "type": "image/webp",
    "etag": "\"43b4e-nYX363Iu8lxc28k9JbhGaV1a4s8\"",
    "mtime": "2026-08-23T05:50:23.930Z",
    "size": 277326,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_019.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_018.webp": {
    "type": "image/webp",
    "etag": "\"46806-ABXRLuCdCxShUQ8YZqwIa8rZob4\"",
    "mtime": "2026-08-23T05:50:23.908Z",
    "size": 288774,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_018.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_020.webp": {
    "type": "image/webp",
    "etag": "\"45bc4-gap2cHDUqWBEJ8rbJKfp2DSqJNA\"",
    "mtime": "2026-08-23T05:50:23.919Z",
    "size": 285636,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_020.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_021.webp": {
    "type": "image/webp",
    "etag": "\"44544-O414UGOCph6BRyOJc5XoM40Fppo\"",
    "mtime": "2026-08-23T05:50:23.936Z",
    "size": 279876,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_021.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_022.webp": {
    "type": "image/webp",
    "etag": "\"4521a-uAEkeWHXgUWtZprAtxlLP5pexkg\"",
    "mtime": "2026-08-23T05:50:23.928Z",
    "size": 283162,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_022.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_023.webp": {
    "type": "image/webp",
    "etag": "\"412a2-ZZecQiz3hwlIdOaJ3jFtjjzU9hg\"",
    "mtime": "2026-08-23T05:50:23.937Z",
    "size": 266914,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_023.webp"
  },
  "/whole/scene1-3.mp4": {
    "type": "video/mp4",
    "etag": "\"a624f4-ag6AF/Q1mpoSIi6HUuGsxQAI1vo\"",
    "mtime": "2026-08-23T05:50:23.479Z",
    "size": 10888436,
    "path": "../public/whole/scene1-3.mp4"
  },
  "/film/frames/scene1-3/landscape/1280/f_024.webp": {
    "type": "image/webp",
    "etag": "\"3f90c-sHxnxffOief9e/1UNWgoTroVmjM\"",
    "mtime": "2026-08-23T05:50:23.958Z",
    "size": 260364,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_024.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_025.webp": {
    "type": "image/webp",
    "etag": "\"3ffc4-telEd4IwloICTdEaSKEfpHFvQ9s\"",
    "mtime": "2026-08-23T05:50:23.944Z",
    "size": 262084,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_025.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_026.webp": {
    "type": "image/webp",
    "etag": "\"3f04e-WNOSTIVhSOFfK/lbfqmzuwitTrA\"",
    "mtime": "2026-08-23T05:50:24.033Z",
    "size": 258126,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_026.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_027.webp": {
    "type": "image/webp",
    "etag": "\"3aad4-kHMkiNjImP4Ajzo8TAY7TXWIUAA\"",
    "mtime": "2026-08-23T05:50:23.943Z",
    "size": 240340,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_027.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_030.webp": {
    "type": "image/webp",
    "etag": "\"3b278-fU2f3QMdmoSNwXaWHuDDi7/8rnY\"",
    "mtime": "2026-08-23T05:50:23.972Z",
    "size": 242296,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_030.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_029.webp": {
    "type": "image/webp",
    "etag": "\"3ab50-5ZRoYozHDSSWQ7/EdlH5TVpp/nA\"",
    "mtime": "2026-08-23T05:50:23.959Z",
    "size": 240464,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_029.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_028.webp": {
    "type": "image/webp",
    "etag": "\"3d8b6-iWrwKMTP0VRRNf/SykSB773wulI\"",
    "mtime": "2026-08-23T05:50:23.956Z",
    "size": 252086,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_028.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_031.webp": {
    "type": "image/webp",
    "etag": "\"3ca64-qWtYWntS5tlcamKaR99iFn/I86k\"",
    "mtime": "2026-08-23T05:50:23.971Z",
    "size": 248420,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_031.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_032.webp": {
    "type": "image/webp",
    "etag": "\"3c504-8n0XpYL7Fpi7z5k1FPiqPy8q11Q\"",
    "mtime": "2026-08-23T05:50:23.984Z",
    "size": 247044,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_032.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_033.webp": {
    "type": "image/webp",
    "etag": "\"3f73e-tJdL+Ws+mj/TN8YOiJy2AOY0hOQ\"",
    "mtime": "2026-08-23T05:50:23.985Z",
    "size": 259902,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_033.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_034.webp": {
    "type": "image/webp",
    "etag": "\"3f4dc-35aIyQkRmto5v0Y5mtbcJ5qeo+Y\"",
    "mtime": "2026-08-23T05:50:23.972Z",
    "size": 259292,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_034.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_037.webp": {
    "type": "image/webp",
    "etag": "\"3fbc8-dqbuYJyJqQ3ZjOEylnKELwuNGdI\"",
    "mtime": "2026-08-23T05:50:23.992Z",
    "size": 261064,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_037.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_036.webp": {
    "type": "image/webp",
    "etag": "\"403f0-JD92ePGgEyVpQzPKajKPWI8rUWk\"",
    "mtime": "2026-08-23T05:50:23.994Z",
    "size": 263152,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_036.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_035.webp": {
    "type": "image/webp",
    "etag": "\"3d106-VoxpVhUbDEuNyvVzzoi957ADYks\"",
    "mtime": "2026-08-23T05:50:23.985Z",
    "size": 250118,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_035.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_038.webp": {
    "type": "image/webp",
    "etag": "\"41dfa-aZ9fVcRpmyJ+4GHG8kNWiyk9GSk\"",
    "mtime": "2026-08-23T05:50:23.998Z",
    "size": 269818,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_038.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_039.webp": {
    "type": "image/webp",
    "etag": "\"42048-nNN5hoYBircQluUv8MKTFbmHkpU\"",
    "mtime": "2026-08-23T05:50:23.994Z",
    "size": 270408,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_039.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_040.webp": {
    "type": "image/webp",
    "etag": "\"417c6-14O9+CIzXpTrl80evNrdxFIuiEE\"",
    "mtime": "2026-08-23T05:50:24.004Z",
    "size": 268230,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_040.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_041.webp": {
    "type": "image/webp",
    "etag": "\"43468-fLqYvGrALNdnHunuj3CAa3XseiY\"",
    "mtime": "2026-08-23T05:50:24.005Z",
    "size": 275560,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_041.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_042.webp": {
    "type": "image/webp",
    "etag": "\"43d78-0LsUiBoGeA7kJw+BbttF3ugsSHU\"",
    "mtime": "2026-08-23T05:50:24.009Z",
    "size": 277880,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_042.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_043.webp": {
    "type": "image/webp",
    "etag": "\"404b2-Q6JnevnN/5CUvotpfcy8ZdWLa/A\"",
    "mtime": "2026-08-23T05:50:24.020Z",
    "size": 263346,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_043.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_044.webp": {
    "type": "image/webp",
    "etag": "\"42066-IvmaCtv0uYgGB4NtBX5aXbW7ip0\"",
    "mtime": "2026-08-23T05:50:24.018Z",
    "size": 270438,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_044.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_045.webp": {
    "type": "image/webp",
    "etag": "\"42342-SYKY0vmcfn0lvUU6BQEmNJXc+tI\"",
    "mtime": "2026-08-23T05:50:24.040Z",
    "size": 271170,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_045.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_046.webp": {
    "type": "image/webp",
    "etag": "\"43134-vKiHrlY3WoqjuFGNOYL3IZM39pk\"",
    "mtime": "2026-08-23T05:50:24.021Z",
    "size": 274740,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_046.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_047.webp": {
    "type": "image/webp",
    "etag": "\"43cfc-gGu59z5iplebe7Jx0h4gex9neCM\"",
    "mtime": "2026-08-23T05:50:24.040Z",
    "size": 277756,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_047.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_048.webp": {
    "type": "image/webp",
    "etag": "\"434e8-PSVVOHyt78t2AFxRSG3XV93S+H8\"",
    "mtime": "2026-08-23T05:50:24.051Z",
    "size": 275688,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_048.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_049.webp": {
    "type": "image/webp",
    "etag": "\"4432c-rGfMQpNyRINTuoG/9FACG5B4seI\"",
    "mtime": "2026-08-23T05:50:24.050Z",
    "size": 279340,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_049.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_050.webp": {
    "type": "image/webp",
    "etag": "\"448d6-85QKQSfksWyjdY1ArVQ5FG/eax8\"",
    "mtime": "2026-08-23T05:50:24.053Z",
    "size": 280790,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_050.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_051.webp": {
    "type": "image/webp",
    "etag": "\"42c06-ud2tM6rRYUVxPavRY+ueEU9NJA0\"",
    "mtime": "2026-08-23T05:50:24.063Z",
    "size": 273414,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_051.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_052.webp": {
    "type": "image/webp",
    "etag": "\"44fa4-bTorr2ImqxA+iT1nHVtDoZ+SaIw\"",
    "mtime": "2026-08-23T05:50:24.063Z",
    "size": 282532,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_052.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_053.webp": {
    "type": "image/webp",
    "etag": "\"442a0-nKWIgkWgCBdobpUvwFCdWVVkQsI\"",
    "mtime": "2026-08-23T05:50:24.077Z",
    "size": 279200,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_053.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_054.webp": {
    "type": "image/webp",
    "etag": "\"45a7a-DHwkc6sKAqtmXPZ6IEaAlZwpc+I\"",
    "mtime": "2026-08-23T05:50:24.063Z",
    "size": 285306,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_054.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_055.webp": {
    "type": "image/webp",
    "etag": "\"4736e-O4fF6i/tBgLmpCruMW38R7msGXw\"",
    "mtime": "2026-08-23T05:50:24.075Z",
    "size": 291694,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_055.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_057.webp": {
    "type": "image/webp",
    "etag": "\"47b9a-Be/Hmb5lY7tbLn1RuRHNBkT0bWU\"",
    "mtime": "2026-08-23T05:50:24.107Z",
    "size": 293786,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_057.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_056.webp": {
    "type": "image/webp",
    "etag": "\"4678a-irkCZuLRm3i9foCqmxHB1fqZgXM\"",
    "mtime": "2026-08-23T05:50:24.077Z",
    "size": 288650,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_056.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_058.webp": {
    "type": "image/webp",
    "etag": "\"477d0-rUwLq8WsCbUVCmiVGSpzBWzWbzg\"",
    "mtime": "2026-08-23T05:50:24.090Z",
    "size": 292816,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_058.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_059.webp": {
    "type": "image/webp",
    "etag": "\"470c6-OXGPGfHqFwRuppQXov2V6+Mj+ps\"",
    "mtime": "2026-08-23T05:50:24.090Z",
    "size": 291014,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_059.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_060.webp": {
    "type": "image/webp",
    "etag": "\"48324-cnCf3rjSeE4J36Ohgqa0/w5StRE\"",
    "mtime": "2026-08-23T05:50:24.097Z",
    "size": 295716,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_060.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_061.webp": {
    "type": "image/webp",
    "etag": "\"4763a-9MuNbKLH5KgFBqt0uYkbkq6dJnU\"",
    "mtime": "2026-08-23T05:50:24.090Z",
    "size": 292410,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_061.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_062.webp": {
    "type": "image/webp",
    "etag": "\"47d14-wEUlgJuRQqUqaKezJsqc0dwxmi4\"",
    "mtime": "2026-08-23T05:50:24.099Z",
    "size": 294164,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_062.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_063.webp": {
    "type": "image/webp",
    "etag": "\"4525a-WMQHTSumYPza/TLEpX6ZMoZSai4\"",
    "mtime": "2026-08-23T05:50:24.099Z",
    "size": 283226,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_063.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_064.webp": {
    "type": "image/webp",
    "etag": "\"466da-TY84nc+AC0vyVt4EUI5JVpyb7jQ\"",
    "mtime": "2026-08-23T05:50:24.111Z",
    "size": 288474,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_064.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_065.webp": {
    "type": "image/webp",
    "etag": "\"44e66-sNdnK7blmR/sHCWHzORPj/nx6vE\"",
    "mtime": "2026-08-23T05:50:24.110Z",
    "size": 282214,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_065.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_066.webp": {
    "type": "image/webp",
    "etag": "\"485de-tvs7AJa4ftZmDJ73e9BtaV/P9e4\"",
    "mtime": "2026-08-23T05:50:24.105Z",
    "size": 296414,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_066.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_067.webp": {
    "type": "image/webp",
    "etag": "\"46d16-yLl1Dn+80Mesk0ojiZDA5Vn0g/4\"",
    "mtime": "2026-08-23T05:50:24.105Z",
    "size": 290070,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_067.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_068.webp": {
    "type": "image/webp",
    "etag": "\"48bd0-yAjXKPxILCRe+8APCeMAGmw1HME\"",
    "mtime": "2026-08-23T05:50:24.136Z",
    "size": 297936,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_068.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_069.webp": {
    "type": "image/webp",
    "etag": "\"49768-QWcqQHR3k5ITQ1S2lmuGSver0BU\"",
    "mtime": "2026-08-23T05:50:24.114Z",
    "size": 300904,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_069.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_070.webp": {
    "type": "image/webp",
    "etag": "\"4a060-Ggf4S6Z6xu8zxZPsySefR96wm/I\"",
    "mtime": "2026-08-23T05:50:24.139Z",
    "size": 303200,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_070.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_071.webp": {
    "type": "image/webp",
    "etag": "\"4afea-0FxIv5xqSexAUiaHlLi7YjRzuSk\"",
    "mtime": "2026-08-23T05:50:24.140Z",
    "size": 307178,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_071.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_072.webp": {
    "type": "image/webp",
    "etag": "\"4b612-K2HH+fZwyj4rrzBAK6Td0oYiWII\"",
    "mtime": "2026-08-23T05:50:24.149Z",
    "size": 308754,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_072.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_073.webp": {
    "type": "image/webp",
    "etag": "\"4cb84-3y0jbrXrUmQ83xabfTavOjmzuuo\"",
    "mtime": "2026-08-23T05:50:24.148Z",
    "size": 314244,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_073.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_075.webp": {
    "type": "image/webp",
    "etag": "\"4cd52-WMX9T+OFUqP63UEu4zGtGk9sDA0\"",
    "mtime": "2026-08-23T05:50:24.163Z",
    "size": 314706,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_075.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_074.webp": {
    "type": "image/webp",
    "etag": "\"4ccf8-KWqoszzHpfVzDqsoFfPcN+vVE2Y\"",
    "mtime": "2026-08-23T05:50:24.150Z",
    "size": 314616,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_074.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_077.webp": {
    "type": "image/webp",
    "etag": "\"4ce34-drurN404wRv0VRxaXTzhwnly0kQ\"",
    "mtime": "2026-08-23T05:50:24.161Z",
    "size": 314932,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_077.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_078.webp": {
    "type": "image/webp",
    "etag": "\"4c5ac-KRwoqCPpphq5FLoM2UwOeRmYPEM\"",
    "mtime": "2026-08-23T05:50:24.176Z",
    "size": 312748,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_078.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_076.webp": {
    "type": "image/webp",
    "etag": "\"4cd46-tfbugPFSOE/mxYxJJRPDk/Xe4lg\"",
    "mtime": "2026-08-23T05:50:24.199Z",
    "size": 314694,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_076.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_079.webp": {
    "type": "image/webp",
    "etag": "\"4cc4c-ibzGCNAxvBJDcTnkrLsCfHdG7t0\"",
    "mtime": "2026-08-23T05:50:24.161Z",
    "size": 314444,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_079.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_080.webp": {
    "type": "image/webp",
    "etag": "\"4c410-mrPf8RwjB2w8fB0G4/1Iuh0u7ZQ\"",
    "mtime": "2026-08-23T05:50:24.186Z",
    "size": 312336,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_080.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_081.webp": {
    "type": "image/webp",
    "etag": "\"4cd3e-sMG5ip+OF7m+JMff5d3FQeWfWkI\"",
    "mtime": "2026-08-23T05:50:24.174Z",
    "size": 314686,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_081.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_082.webp": {
    "type": "image/webp",
    "etag": "\"4d696-USCWkuhx0uT/RISOFMLfH+fbgnM\"",
    "mtime": "2026-08-23T05:50:24.175Z",
    "size": 317078,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_082.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_083.webp": {
    "type": "image/webp",
    "etag": "\"466c8-7+pwdk3kPXZaRL4cJNf0IXjg9gw\"",
    "mtime": "2026-08-23T05:50:24.186Z",
    "size": 288456,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_083.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_084.webp": {
    "type": "image/webp",
    "etag": "\"4812a-+9jXnxX4JRb8lbrvjxua0Hr8wJg\"",
    "mtime": "2026-08-23T05:50:24.188Z",
    "size": 295210,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_084.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_085.webp": {
    "type": "image/webp",
    "etag": "\"4a186-iWWIc6TMANrIQrrcP9Ecnhm84bo\"",
    "mtime": "2026-08-23T05:50:24.199Z",
    "size": 303494,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_085.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_086.webp": {
    "type": "image/webp",
    "etag": "\"4af3c-A6vXaqg/Jd33K9YxtXBCujgTj4w\"",
    "mtime": "2026-08-23T05:50:24.199Z",
    "size": 307004,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_086.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_088.webp": {
    "type": "image/webp",
    "etag": "\"49f7c-VlaGaeTWAEQog/YknPazYyt9Gvg\"",
    "mtime": "2026-08-23T05:50:24.223Z",
    "size": 302972,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_088.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_087.webp": {
    "type": "image/webp",
    "etag": "\"4b49c-uJMHXRTpKrHR7o8gLLS7CAjr8w4\"",
    "mtime": "2026-08-23T05:50:24.209Z",
    "size": 308380,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_087.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_089.webp": {
    "type": "image/webp",
    "etag": "\"4a3d2-0pd67dJBYt+gzB/g6QzBJcb7OIw\"",
    "mtime": "2026-08-23T05:50:24.209Z",
    "size": 304082,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_089.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_090.webp": {
    "type": "image/webp",
    "etag": "\"49fb4-wC7UyJaZ7WXnmvm6kbZddkQxBnw\"",
    "mtime": "2026-08-23T05:50:24.223Z",
    "size": 303028,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_090.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_091.webp": {
    "type": "image/webp",
    "etag": "\"495ec-VJokWDFR76axn9AKg3yNefjWna4\"",
    "mtime": "2026-08-23T05:50:24.225Z",
    "size": 300524,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_091.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_092.webp": {
    "type": "image/webp",
    "etag": "\"4a328-rKnAbvlsrow7+DjCOkOUWpCmja8\"",
    "mtime": "2026-08-23T05:50:24.272Z",
    "size": 303912,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_092.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_093.webp": {
    "type": "image/webp",
    "etag": "\"48d1a-a1LvV2yX2A4AOhx//JhPw3mBXeY\"",
    "mtime": "2026-08-23T05:50:24.238Z",
    "size": 298266,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_093.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_094.webp": {
    "type": "image/webp",
    "etag": "\"49680-KIi8lrXIh8MOWzZHiiKv6r3BzUs\"",
    "mtime": "2026-08-23T05:50:24.209Z",
    "size": 300672,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_094.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_095.webp": {
    "type": "image/webp",
    "etag": "\"49cae-7wMRgKDyDLwmgOJYfmR5WNJYvXw\"",
    "mtime": "2026-08-23T05:50:24.252Z",
    "size": 302254,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_095.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_096.webp": {
    "type": "image/webp",
    "etag": "\"4892c-/8eD5k3popjlzE6E+WYN26OSmDw\"",
    "mtime": "2026-08-23T05:50:24.239Z",
    "size": 297260,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_096.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_097.webp": {
    "type": "image/webp",
    "etag": "\"48422-z5Eoqb6r65knN6VGbCKzTXwpJY4\"",
    "mtime": "2026-08-23T05:50:24.238Z",
    "size": 295970,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_097.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_098.webp": {
    "type": "image/webp",
    "etag": "\"47c5e-P25je60v6hk5mjPNH9M8GE5je0I\"",
    "mtime": "2026-08-23T05:50:24.246Z",
    "size": 293982,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_098.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_099.webp": {
    "type": "image/webp",
    "etag": "\"44efe-qIOOxNbZrrlfvlvLB3ICklYnYPc\"",
    "mtime": "2026-08-23T05:50:24.246Z",
    "size": 282366,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_099.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_102.webp": {
    "type": "image/webp",
    "etag": "\"44d48-9hpkUT4FCnwm8aequU0CSTva99w\"",
    "mtime": "2026-08-23T05:50:24.252Z",
    "size": 281928,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_102.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_100.webp": {
    "type": "image/webp",
    "etag": "\"459ca-eb8oafcz1/rMrvUG0zFivyZcjmA\"",
    "mtime": "2026-08-23T05:50:24.246Z",
    "size": 285130,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_100.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_101.webp": {
    "type": "image/webp",
    "etag": "\"44c72-euXjJ5lvdaGILIDUm+s/nvEdz3c\"",
    "mtime": "2026-08-23T05:50:24.259Z",
    "size": 281714,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_101.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_103.webp": {
    "type": "image/webp",
    "etag": "\"42102-/ivjuQhQEy+fXt+inRUr2jhHyzY\"",
    "mtime": "2026-08-23T05:50:24.252Z",
    "size": 270594,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_103.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_104.webp": {
    "type": "image/webp",
    "etag": "\"409d6-Chi1MpN+0lZaw70HvJ52mA5C0kQ\"",
    "mtime": "2026-08-23T05:50:24.259Z",
    "size": 264662,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_104.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_105.webp": {
    "type": "image/webp",
    "etag": "\"41788-P0wyF17Jn/y0pWX3/07xeC1Z8D4\"",
    "mtime": "2026-08-23T05:50:24.257Z",
    "size": 268168,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_105.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_106.webp": {
    "type": "image/webp",
    "etag": "\"40584-RZuE1YqyYm6evWfmCI2NUiD7gbY\"",
    "mtime": "2026-08-23T05:50:24.262Z",
    "size": 263556,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_106.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_107.webp": {
    "type": "image/webp",
    "etag": "\"3e4be-ytc/UVMvs3Wy+g62qsfTywdZi2E\"",
    "mtime": "2026-08-23T05:50:24.265Z",
    "size": 255166,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_107.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_108.webp": {
    "type": "image/webp",
    "etag": "\"3cf90-B+somkgVPX1mQQK1qWQwXr+9f/w\"",
    "mtime": "2026-08-23T05:50:24.265Z",
    "size": 249744,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_108.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_109.webp": {
    "type": "image/webp",
    "etag": "\"393dc-L9XCs40P+AAdZxta3UKvZrt2RHY\"",
    "mtime": "2026-08-23T05:50:24.274Z",
    "size": 234460,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_109.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_110.webp": {
    "type": "image/webp",
    "etag": "\"3783c-NJECUKCd2Go6jE4/pyuYxk2v2Dw\"",
    "mtime": "2026-08-23T05:50:24.271Z",
    "size": 227388,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_110.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_111.webp": {
    "type": "image/webp",
    "etag": "\"2ffd8-fv5+HKC3Lu+/wpKHN+QQQE8pWAE\"",
    "mtime": "2026-08-23T05:50:24.268Z",
    "size": 196568,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_111.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_112.webp": {
    "type": "image/webp",
    "etag": "\"2f7f4-0dJq7+gqMqwJMW2jYNcmBULqYcs\"",
    "mtime": "2026-08-23T05:50:24.272Z",
    "size": 194548,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_112.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_113.webp": {
    "type": "image/webp",
    "etag": "\"2d9e6-/3c9ObWb0Xql0xkNs88eNX7Ypi4\"",
    "mtime": "2026-08-23T05:50:24.276Z",
    "size": 186854,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_113.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_114.webp": {
    "type": "image/webp",
    "etag": "\"2b2fa-9PQQe852yVolBPU1N8MBqWGhFpo\"",
    "mtime": "2026-08-23T05:50:24.278Z",
    "size": 176890,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_114.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_115.webp": {
    "type": "image/webp",
    "etag": "\"27a48-4tMYLOu4MzVv188JY6wABef6CoI\"",
    "mtime": "2026-08-23T05:50:24.284Z",
    "size": 162376,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_115.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_116.webp": {
    "type": "image/webp",
    "etag": "\"2507e-q/9VAx5Hxl0htlforflulCOqYmE\"",
    "mtime": "2026-08-23T05:50:24.281Z",
    "size": 151678,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_116.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_117.webp": {
    "type": "image/webp",
    "etag": "\"22e8e-DjcB9vwEsRU3gBigVbliEd821KA\"",
    "mtime": "2026-08-23T05:50:24.281Z",
    "size": 142990,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_117.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_118.webp": {
    "type": "image/webp",
    "etag": "\"1f832-Pq04XnnCfupmf3Zm0GeDy/UXrvE\"",
    "mtime": "2026-08-23T05:50:24.274Z",
    "size": 129074,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_118.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_119.webp": {
    "type": "image/webp",
    "etag": "\"1d040-FeWxYzUkLLHD6tSRaIyhxBXYEro\"",
    "mtime": "2026-08-23T05:50:24.275Z",
    "size": 118848,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_119.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_120.webp": {
    "type": "image/webp",
    "etag": "\"1ada8-RZYCLHFz81b64G72cudDNJ/uHno\"",
    "mtime": "2026-08-23T05:50:24.280Z",
    "size": 109992,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_120.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_121.webp": {
    "type": "image/webp",
    "etag": "\"18faa-F4Lu3rQiFJ9uxsCgOQ8SGmmdFHI\"",
    "mtime": "2026-08-23T05:50:24.279Z",
    "size": 102314,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_121.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_122.webp": {
    "type": "image/webp",
    "etag": "\"1828a-wSfd/nR6iCK2kVfOlltL18/NBxM\"",
    "mtime": "2026-08-23T05:50:24.283Z",
    "size": 98954,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_122.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_123.webp": {
    "type": "image/webp",
    "etag": "\"1801c-w+1TXXXXYl2LFWlJPS//9I71t9k\"",
    "mtime": "2026-08-23T05:50:24.283Z",
    "size": 98332,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_123.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_124.webp": {
    "type": "image/webp",
    "etag": "\"18330-SliQCGzHVohTMr7awzYtfPl/yaM\"",
    "mtime": "2026-08-23T05:50:24.287Z",
    "size": 99120,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_124.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_125.webp": {
    "type": "image/webp",
    "etag": "\"17e62-Lmn0Ee5yBfZeBeFbPAYmfZhyv5Q\"",
    "mtime": "2026-08-23T05:50:24.286Z",
    "size": 97890,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_125.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_126.webp": {
    "type": "image/webp",
    "etag": "\"17c36-5Os/fZRb3TrTmJqLIZlnm8lEVkc\"",
    "mtime": "2026-08-23T05:50:24.285Z",
    "size": 97334,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_126.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_127.webp": {
    "type": "image/webp",
    "etag": "\"17522-vZhGfVHj6v6ody6WTetrFNMLTIc\"",
    "mtime": "2026-08-23T05:50:24.286Z",
    "size": 95522,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_127.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_128.webp": {
    "type": "image/webp",
    "etag": "\"15ae0-buj2uQhoLGDRUDyUQdFrgnv07Dk\"",
    "mtime": "2026-08-23T05:50:24.286Z",
    "size": 88800,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_128.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_129.webp": {
    "type": "image/webp",
    "etag": "\"164f6-l+NZvlN2oTgCGHt78GLUCEFlH2Q\"",
    "mtime": "2026-08-23T05:50:24.286Z",
    "size": 91382,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_129.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_130.webp": {
    "type": "image/webp",
    "etag": "\"1524c-4P4E0kEHXzSXxncLXCGSDQB8OIo\"",
    "mtime": "2026-08-23T05:50:24.287Z",
    "size": 86604,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_130.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_131.webp": {
    "type": "image/webp",
    "etag": "\"1478e-5N/J2CHGkc3KDXMQMjmmCPTpyOk\"",
    "mtime": "2026-08-23T05:50:24.289Z",
    "size": 83854,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_131.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_132.webp": {
    "type": "image/webp",
    "etag": "\"131c2-5405nz2+JQ5GPrt5zVxu98Ot1ng\"",
    "mtime": "2026-08-23T05:50:24.290Z",
    "size": 78274,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_132.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_133.webp": {
    "type": "image/webp",
    "etag": "\"13228-DY2/M0gFMmUfpO8eyYLqSimIAV4\"",
    "mtime": "2026-08-23T05:50:24.290Z",
    "size": 78376,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_133.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_134.webp": {
    "type": "image/webp",
    "etag": "\"147aa-5kf9mtijYgGxti3VL4kewItg7MM\"",
    "mtime": "2026-08-23T05:50:24.290Z",
    "size": 83882,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_134.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_135.webp": {
    "type": "image/webp",
    "etag": "\"14c02-jboUbB9GGf02ENRUuKrxOEp71xI\"",
    "mtime": "2026-08-23T05:50:24.293Z",
    "size": 84994,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_135.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_136.webp": {
    "type": "image/webp",
    "etag": "\"171ae-cYOIf26By2bHLtbE9WcHArAPyRo\"",
    "mtime": "2026-08-23T05:50:24.292Z",
    "size": 94638,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_136.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_137.webp": {
    "type": "image/webp",
    "etag": "\"13646-eRWr1hg1wDCDz0zC25Jdj7lQBJQ\"",
    "mtime": "2026-08-23T05:50:24.293Z",
    "size": 79430,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_137.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_138.webp": {
    "type": "image/webp",
    "etag": "\"16f14-1B60VEfZge8KJqoqRWvgr8p5DQw\"",
    "mtime": "2026-08-23T05:50:24.290Z",
    "size": 93972,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_138.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_139.webp": {
    "type": "image/webp",
    "etag": "\"151a8-ckeHoZFt98RiqsteO5YSJGwQojM\"",
    "mtime": "2026-08-23T05:50:24.292Z",
    "size": 86440,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_139.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_140.webp": {
    "type": "image/webp",
    "etag": "\"11ec0-4nyvrML/zj2gARdIk4oqAFxNegU\"",
    "mtime": "2026-08-23T05:50:24.292Z",
    "size": 73408,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_140.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_141.webp": {
    "type": "image/webp",
    "etag": "\"107b6-onbGk63PJfRYSUkcabRYDGk0diI\"",
    "mtime": "2026-08-23T05:50:24.296Z",
    "size": 67510,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_141.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_142.webp": {
    "type": "image/webp",
    "etag": "\"1270c-VORSmWwXn5b3NkH0pQiwgI1oRkE\"",
    "mtime": "2026-08-23T05:50:24.295Z",
    "size": 75532,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_142.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_143.webp": {
    "type": "image/webp",
    "etag": "\"131a2-bjZXJNuVhs750jrBfEqQCOtmMOg\"",
    "mtime": "2026-08-23T05:50:24.295Z",
    "size": 78242,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_143.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_144.webp": {
    "type": "image/webp",
    "etag": "\"12704-np/h1t4LGTs1M06HaU4alxjJwh8\"",
    "mtime": "2026-08-23T05:50:24.295Z",
    "size": 75524,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_144.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_145.webp": {
    "type": "image/webp",
    "etag": "\"12748-4F7d96lsC1vWpdW/X9o+AR4vmrU\"",
    "mtime": "2026-08-23T05:50:24.297Z",
    "size": 75592,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_145.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_146.webp": {
    "type": "image/webp",
    "etag": "\"13e1a-8Oxpr59U9WRpgWbuQaQOypu3rQI\"",
    "mtime": "2026-08-23T05:50:24.299Z",
    "size": 81434,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_146.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_147.webp": {
    "type": "image/webp",
    "etag": "\"1362c-20EmQvuadEjsgmUUSWyMZDqrIBI\"",
    "mtime": "2026-08-23T05:50:24.296Z",
    "size": 79404,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_147.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_148.webp": {
    "type": "image/webp",
    "etag": "\"1263c-U7haMJmkeRsAp7uV5KkU5JDbgrM\"",
    "mtime": "2026-08-23T05:50:24.302Z",
    "size": 75324,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_148.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_149.webp": {
    "type": "image/webp",
    "etag": "\"111fe-yvO8zL/+SstGgcts/crx3HLHkRE\"",
    "mtime": "2026-08-23T05:50:24.299Z",
    "size": 70142,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_149.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_150.webp": {
    "type": "image/webp",
    "etag": "\"1120a-tv5ygXiGaroafm8OwU//fhRxZkY\"",
    "mtime": "2026-08-23T05:50:24.300Z",
    "size": 70154,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_150.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_151.webp": {
    "type": "image/webp",
    "etag": "\"116c2-a6zoOoxSFwWfLiNwtFbwMne3Vo8\"",
    "mtime": "2026-08-23T05:50:24.303Z",
    "size": 71362,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_151.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_152.webp": {
    "type": "image/webp",
    "etag": "\"1133a-27qkcfySPTwOPd9plMXQvUsb4qE\"",
    "mtime": "2026-08-23T05:50:24.300Z",
    "size": 70458,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_152.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_153.webp": {
    "type": "image/webp",
    "etag": "\"112fc-mra3j6ziTlbBgAsr1AL2RolfN/s\"",
    "mtime": "2026-08-23T05:50:24.300Z",
    "size": 70396,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_153.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_154.webp": {
    "type": "image/webp",
    "etag": "\"114aa-5BBGXmOn56jFWGC2nrffdbo8DFo\"",
    "mtime": "2026-08-23T05:50:24.301Z",
    "size": 70826,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_154.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_155.webp": {
    "type": "image/webp",
    "etag": "\"112aa-pn64iO2v5nAtLWF5tbtJNfmeG9U\"",
    "mtime": "2026-08-23T05:50:24.301Z",
    "size": 70314,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_155.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_156.webp": {
    "type": "image/webp",
    "etag": "\"10d60-nhdbq7GhVA0ih8Fmn6QWYmGZIKQ\"",
    "mtime": "2026-08-23T05:50:24.302Z",
    "size": 68960,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_156.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_157.webp": {
    "type": "image/webp",
    "etag": "\"102ac-OwRRjrKFTc2dNwUj6KoumFZBLRw\"",
    "mtime": "2026-08-23T05:50:24.303Z",
    "size": 66220,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_157.webp"
  },
  "/film/frames/scene1-3/landscape/1280/f_158.webp": {
    "type": "image/webp",
    "etag": "\"f5c0-VfaYwKED93HoHuIwv3iqdGKDpt4\"",
    "mtime": "2026-08-23T05:50:24.303Z",
    "size": 62912,
    "path": "../public/film/frames/scene1-3/landscape/1280/f_158.webp"
  },
  "/whole/videoupscaled1-3.mp4": {
    "type": "video/mp4",
    "etag": "\"17587ce-zxxqBwhhmjG/IPiwMODHbpl3sIM\"",
    "mtime": "2026-08-23T05:50:23.943Z",
    "size": 24479694,
    "path": "../public/whole/videoupscaled1-3.mp4"
  },
  "/brand/prototype.mov": {
    "type": "video/quicktime",
    "etag": "\"2538cfd-EMOs2dzMKGM5b2BCJBBx/l9NnfE\"",
    "mtime": "2026-08-23T05:50:24.275Z",
    "size": 39030013,
    "path": "../public/brand/prototype.mov"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/_nuxt/":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _jwE8a2 = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const _SxA8c9 = defineEventHandler(() => {});

const _lazy_fINS1R = () => import('../routes/api/leads.post.mjs');
const _lazy_ua28xq = () => import('../routes/api/waitlist.post.mjs');
const _lazy_11mFHh = () => import('../routes/renderer.mjs').then(function (n) { return n.r; });

const handlers = [
  { route: '', handler: _jwE8a2, lazy: false, middleware: true, method: undefined },
  { route: '/api/leads', handler: _lazy_fINS1R, lazy: true, middleware: false, method: "post" },
  { route: '/api/waitlist', handler: _lazy_ua28xq, lazy: true, middleware: false, method: "post" },
  { route: '/__nuxt_error', handler: _lazy_11mFHh, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_11mFHh, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
const server = cert && key ? new Server({ key, cert }, toNodeListener(nitroApp.h3App)) : new Server$1(toNodeListener(nitroApp.h3App));
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const path = process.env.NITRO_UNIX_SOCKET;
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${addressInfo.family === "IPv6" ? `[${addressInfo.address}]` : addressInfo.address}:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(listener, nitroApp);
const nodeServer = {};

export { $fetch as $, hash$1 as A, nodeServer as B, defineRenderHandler as a, getRouteRules as b, createError$1 as c, defineEventHandler as d, encodePath as e, getResponseStatusText as f, getQuery as g, getResponseStatus as h, useNitroApp as i, joinRelativeURL as j, getContext as k, hasProtocol as l, joinURL as m, parseURL as n, decodePath as o, parseQuery as p, isScriptProtocol as q, readBody as r, withTrailingSlash as s, withoutTrailingSlash as t, useRuntimeConfig as u, sanitizeStatusCode as v, withQuery as w, createHooks as x, executeAsync as y, defu as z };
//# sourceMappingURL=nitro.mjs.map
