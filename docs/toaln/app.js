(() => {
  // node_modules/@doars/staark-common/src/array.js
  var arrayify = (data) => arrayifyOrUndefined(data) || [];
  var arrayifyOrUndefined = (data) => data ? Array.isArray(data) ? data : [data] : undefined;

  // node_modules/@doars/staark-common/src/conditional.js
  var conditional = (condition, onTruth, onFalse) => {
    let result = condition ? onTruth : onFalse;
    if (typeof result === "function") {
      result = result();
    }
    return arrayify(result);
  };
  // node_modules/@doars/staark-common/src/marker.js
  var marker = "n";

  // node_modules/@doars/staark-common/src/node.js
  var node = (type, attributesOrContents, contents) => {
    if (attributesOrContents && (typeof attributesOrContents !== "object" || attributesOrContents._ === marker || Array.isArray(attributesOrContents))) {
      contents = attributesOrContents;
      attributesOrContents = undefined;
    }
    return {
      _: marker,
      a: attributesOrContents,
      c: arrayifyOrUndefined(contents),
      t: type
    };
  };
  // node_modules/@doars/staark-common/src/match.js
  var match = (key, lookup, fallback) => {
    let result;
    if (lookup && key in lookup && lookup[key]) {
      result = lookup[key];
    } else {
      result = fallback;
    }
    if (typeof result === "function") {
      result = result();
    }
    return arrayify(result);
  };
  // node_modules/@doars/staark-common/src/clone.js
  var cloneRecursive2 = (value) => {
    if (typeof value === "object") {
      const clone = Array.isArray(value) ? [] : {};
      for (const key in value) {
        clone[key] = cloneRecursive2(value[key]);
      }
      return clone;
    }
    return value;
  };

  // node_modules/@doars/staark-common/src/compare.js
  var equalRecursive = (valueA, valueB) => {
    if (valueA === valueB) {
      return true;
    }
    if (!valueA || !valueB || typeof valueA !== "object" || typeof valueB !== "object") {
      return valueA === valueB;
    }
    if (valueA instanceof Date) {
      return valueB instanceof Date && valueA.getTime() === valueB.getTime();
    }
    const keys = Object.keys(valueA);
    return keys.length === Object.keys(valueB).length && keys.every((k) => equalRecursive(valueA[k], valueB[k]));
  };

  // node_modules/@doars/staark-common/src/element.js
  var childrenToNodes = (element) => {
    const abstractChildNodes = [];
    for (const childNode of element.childNodes) {
      if (childNode instanceof Text) {
        abstractChildNodes.push(childNode.textContent ?? "");
      } else {
        const attributes = {};
        for (const attribute of childNode.attributes) {
          attributes[attribute.name] = attribute.value;
        }
        abstractChildNodes.push(node(childNode.nodeName, attributes, childrenToNodes(childNode)));
      }
    }
    return abstractChildNodes;
  };

  // node_modules/@doars/staark/src/library/proxy.js
  var proxify = (root, onChange) => {
    const handler = {
      deleteProperty: (target, key) => {
        if (Reflect.has(target, key)) {
          const deleted = Reflect.deleteProperty(target, key);
          if (deleted) {
            onChange();
          }
          return deleted;
        }
        return true;
      },
      set: (target, key, value) => {
        const existingValue = target[key];
        if (existingValue !== value) {
          if (value && typeof value === "object") {
            value = add(value);
          }
          target[key] = value;
          onChange();
        }
        return true;
      }
    };
    const add = (target) => {
      for (const key in target) {
        if (target[key] && typeof target[key] === "object") {
          target[key] = add(target[key]);
        }
      }
      return new Proxy(target, handler);
    };
    return add(root);
  };

  // node_modules/@doars/staark/src/library/mount.js
  var mount = (rootElement, renderView, initialState, oldAbstractTree) => {
    const setBefore = "moveBefore" in Element.prototype ? "moveBefore" : "insertBefore";
    if (typeof initialState === "string") {
      initialState = JSON.parse(initialState);
    }
    if (!initialState) {
      initialState = {};
    }
    let updatePromise = null;
    const triggerUpdate = () => {
      if (!updatePromise) {
        updatePromise = Promise.resolve().then(updateAbstracts);
      }
      return updatePromise;
    };
    const state = Object.getPrototypeOf(initialState) === Proxy.prototype ? initialState : proxify(initialState, triggerUpdate);
    const updateAttributes = (element, newAttributes, oldAttributes) => {
      if (newAttributes) {
        for (const name in newAttributes) {
          let value = newAttributes[name];
          if (value) {
            const type = typeof value;
            if (type === "function") {
              const oldValue = oldAttributes?.[name];
              if (oldValue?.f === value) {
                newAttributes[name] = oldValue;
              } else {
                if (oldValue) {
                  element.removeEventListener(name, oldValue);
                }
                const listener = newAttributes[name] = (event) => {
                  value(event, state);
                };
                element.addEventListener(name, listener);
                listener.f = value;
              }
            } else {
              if (name === "class") {
                if (typeof value === "object") {
                  if (Array.isArray(value)) {
                    value = value.join(" ");
                  } else {
                    let classNames = "";
                    for (const className in value) {
                      if (value[className]) {
                        classNames += " " + className;
                      }
                    }
                    value = classNames;
                  }
                }
                element.className = value;
              } else if (name === "style" && typeof value === "object") {
                for (let styleName in value) {
                  let styleValue = value[styleName];
                  if (styleName.includes("-", 1)) {
                    element.style.setProperty(styleName, styleValue);
                  } else {
                    element.style[styleName] = styleValue;
                  }
                }
                if (oldAttributes && oldAttributes[name] && typeof oldAttributes[name] === "object" && !Array.isArray(oldAttributes[name])) {
                  for (let styleName in oldAttributes[name]) {
                    if (!value[styleName]) {
                      if (styleName.includes("-", 1)) {
                        element.style.removeProperty(styleName);
                      } else {
                        element.style[styleName] = null;
                      }
                    }
                  }
                }
              } else {
                if (value === true) {
                  value = "true";
                } else if (type !== "string") {
                  value = value.toString();
                }
                element.setAttribute(name, value);
                if (name === "value") {
                  element.value = value;
                }
              }
            }
          }
        }
      }
      if (oldAttributes) {
        for (const name in oldAttributes) {
          const value = oldAttributes[name];
          if (!newAttributes || !newAttributes[name]) {
            if (typeof value === "function") {
              element.removeEventListener(name, oldAttributes[name]);
            } else if (name === "class") {
              element.className = "";
            } else if (name === "style") {
              element.style.cssText = "";
            } else if (name === "value") {
              element.value = "";
            } else {
              element.removeAttribute(name);
            }
          }
        }
      }
    };
    let oldMemoMap = new WeakMap;
    let newMemoMap = new WeakMap;
    const updateChildren = (element, newChildAbstracts, oldChildAbstracts, inSvg) => {
      let newIndex = 0;
      let newCount = 0;
      if (newChildAbstracts) {
        for (;newIndex < newChildAbstracts.length; newIndex++) {
          const newAbstract = newChildAbstracts[newIndex];
          if (newAbstract.r) {
            let match2 = oldMemoMap.get(newAbstract.r);
            if (!match2 || !equalRecursive(match2.m, newAbstract.m)) {
              match2 = {
                c: arrayifyOrUndefined(newAbstract.r(state, newAbstract.m)),
                m: newAbstract.m,
                r: newAbstract.r
              };
            }
            newMemoMap.set(newAbstract.r, match2);
            newChildAbstracts.splice(newIndex, 1, ...cloneRecursive2(match2.c));
            newIndex--;
            continue;
          }
          let matched = false;
          if (oldChildAbstracts) {
            for (let oldIndex = newIndex - newCount;oldIndex < oldChildAbstracts.length; oldIndex++) {
              const oldAbstract = oldChildAbstracts[oldIndex];
              if (oldAbstract.t && newAbstract.t === oldAbstract.t || !oldAbstract.t && !newAbstract.t) {
                matched = true;
                if (newIndex !== oldIndex + newCount) {
                  element[setBefore](element.childNodes[oldIndex + newCount], element.childNodes[newIndex]);
                  oldChildAbstracts.splice(newIndex - newCount, 0, oldChildAbstracts.splice(oldIndex, 1)[0]);
                }
                if (newAbstract.t) {
                  updateAttributes(element.childNodes[newIndex], newAbstract.a, oldAbstract.a);
                  updateChildren(element.childNodes[newIndex], newAbstract.c, oldAbstract.c, inSvg || newAbstract.t === "SVG" || newAbstract.t === "svg");
                } else if (oldAbstract !== newAbstract) {
                  element.childNodes[newIndex].textContent = newAbstract;
                }
                break;
              }
            }
          }
          if (!matched) {
            let newNode;
            if (newAbstract.t) {
              const _inSvg = inSvg || newAbstract.t === "SVG" || newAbstract.t === "svg";
              if (_inSvg) {
                newNode = document.createElementNS("http://www.w3.org/2000/svg", newAbstract.t);
              } else {
                newNode = document.createElement(newAbstract.t);
              }
              updateAttributes(newNode, newAbstract.a, undefined, _inSvg);
              updateChildren(newNode, newAbstract.c, undefined, _inSvg);
            } else {
              newNode = document.createTextNode(newAbstract);
            }
            element.insertBefore(newNode, element.childNodes[newIndex]);
            newCount++;
          }
        }
      }
      if (oldChildAbstracts) {
        const elementLength = oldChildAbstracts.length + newCount;
        if (elementLength >= newIndex) {
          for (let i = elementLength - 1;i >= newIndex; i--) {
            element.childNodes[i].remove();
          }
        }
      }
    };
    const _rootElement = typeof rootElement === "string" ? document.querySelector(rootElement) || document.body.appendChild(document.createElement("div")) : rootElement;
    if (typeof oldAbstractTree === "string") {
      try {
        oldAbstractTree = JSON.parse(oldAbstractTree);
      } catch (error) {
        oldAbstractTree = null;
      }
    }
    if (!oldAbstractTree) {
      oldAbstractTree = childrenToNodes(_rootElement);
    }
    let active = true, updating = false;
    const updateAbstracts = () => {
      if (active && !updating && updatePromise) {
        updating = true;
        updatePromise = null;
        let newAbstractTree = arrayifyOrUndefined(renderView(state));
        updateChildren(_rootElement, newAbstractTree, oldAbstractTree);
        oldAbstractTree = newAbstractTree;
        oldMemoMap = newMemoMap;
        newMemoMap = new WeakMap;
        updating = false;
      }
    };
    triggerUpdate();
    updateAbstracts();
    return [
      triggerUpdate,
      () => {
        if (active) {
          active = false;
          for (let i = _rootElement.childNodes.length - 1;i >= 0; i--) {
            _rootElement.childNodes[i].remove();
          }
        }
      },
      state
    ];
  };
  // node_modules/@doars/vroagn/src/utilities/clone.js
  var cloneRecursive3 = (value) => {
    if (typeof value === "object") {
      const clone = Array.isArray(value) ? [] : {};
      for (const key in value) {
        clone[key] = cloneRecursive3(value[key]);
      }
      return clone;
    }
    return value;
  };

  // node_modules/@doars/vroagn/src/utilities/delay.js
  var delay = async (time) => {
    if (time > 0) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }
    return null;
  };

  // node_modules/@doars/vroagn/src/utilities/type.js
  var normalizeContentType = (contentType) => contentType.split(";")[0].trim().toLowerCase();
  var getFileExtension = (url) => {
    const match3 = url.match(/\.([^./?]+)(?:[?#]|$)/);
    return match3 ? match3[1].toLowerCase() : null;
  };
  var getType = (url, responseHeaders, requestHeaders) => {
    const contentType = responseHeaders.get("Content-Type");
    if (contentType) {
      return normalizeContentType(contentType);
    }
    if (requestHeaders) {
      if (requestHeaders["Accept"]) {
        const acceptTypes = requestHeaders["Accept"].split(",");
        for (const type of acceptTypes) {
          if (type.trim() !== "*/*") {
            return normalizeContentType(type);
          }
        }
      }
    }
    const extension = getFileExtension(url);
    if (extension) {
      return extension;
    }
    return "";
  };

  // node_modules/@doars/vroagn/src/library/request.js
  var DEFAULT_VALUES = {
    method: "get",
    retryCodes: [429, 503, 504],
    retryDelay: 500
  };
  var create = (initialOptions) => {
    initialOptions = {
      ...DEFAULT_VALUES,
      ...cloneRecursive3(initialOptions)
    };
    let lastExecutionTime = 0;
    let activeRequests = 0;
    let totalRequests = 0;
    let debounceTimeout = null;
    const throttle = async (throttleValue) => {
      const now = Date.now();
      const waitTime = throttleValue - (now - lastExecutionTime);
      lastExecutionTime = now + (waitTime > 0 ? waitTime : 0);
      await delay(waitTime);
    };
    const debounce = (debounceValue) => {
      return new Promise((resolve) => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(resolve, debounceValue);
      });
    };
    const sendRequest = async (options) => {
      if (options.maxRequests !== undefined && totalRequests >= options.maxRequests) {
        return [new Error("Maximum request limit reached"), null, null];
      }
      totalRequests++;
      const config = {
        cache: options.cache,
        credentials: options.credentials,
        headers: options.headers,
        method: options.method,
        mode: options.mode,
        redirect: options.redirect,
        body: options.body ? JSON.stringify(options.body) : undefined
      };
      let url = (options.domain || "") + (options.path || "");
      if (options.queryParams) {
        url += "?" + new URLSearchParams(options.queryParams).toString();
      }
      if (options.timeout) {
        const controller = options.abort || new AbortController;
        config.signal = controller.signal;
        setTimeout(() => controller.abort(), options.timeout);
      }
      const executeFetch = async () => {
        const response2 = await (options.fetch ?? fetch)(url, config);
        if (!response2.ok) {
          return [new Error("Invalid response"), response2, null];
        }
        try {
          let result2;
          let foundParser = false;
          const type = options.type || getType(url, response2.headers, options.headers);
          if (options.parsers) {
            for (const parser of options.parsers) {
              foundParser = parser.types.includes(type);
              if (foundParser) {
                result2 = await parser.parser(response2, options, type);
                break;
              }
            }
          }
          if (!foundParser) {
            switch (type.toLowerCase()) {
              case "arraybuffer":
                result2 = await response2.arrayBuffer();
                break;
              case "blob":
                result2 = await response2.blob();
                break;
              case "formdata":
                result2 = await response2.formData();
                break;
              case "text/plain":
              case "text":
              case "txt":
                result2 = await response2.text();
                break;
              case "text/html-partial":
              case "html-partial":
                result2 = await response2.text();
                const template = document.createElement("template");
                template.innerHTML = result2;
                result2 = template.content.childNodes;
                break;
              case "text/html":
              case "html":
                result2 = await response2.text();
                result2 = new DOMParser().parseFromString(result2, "text/html");
                break;
              case "application/json":
              case "text/json":
              case "json":
                result2 = await response2.json();
                break;
              case "image/svg+xml":
              case "svg":
                result2 = await response2.text();
                result2 = new DOMParser().parseFromString(result2, "image/svg+xml");
                break;
              case "application/xml":
              case "text/xml":
              case "xml":
                result2 = await response2.text();
                result2 = new DOMParser().parseFromString(result2, "application/xml");
                break;
            }
          }
          return [null, response2, result2];
        } catch (error2) {
          return [error2 || new Error("Thrown parsing error is falsy"), response2, null];
        }
      };
      const retryRequest = async () => {
        let attempt = 0;
        const retryAttempts = options.retryAttempts || 0;
        const retryDelay = options.retryDelay || 0;
        while (attempt < retryAttempts) {
          const [error2, response2, result2] = await executeFetch();
          if (!error2) {
            return [error2, response2, result2];
          }
          if (!options.retryCodes?.includes(response2.status || 200)) {
            return [new Error("Invalid status code"), response2, result2];
          }
          attempt++;
          if (attempt >= retryAttempts) {
            return [new Error("Too many retry attempts"), response2, result2];
          }
          let delayTime = retryDelay * Math.pow(2, attempt - 1);
          const retryAfter = response2.headers.get("Retry-After");
          if (retryAfter) {
            const retryAfterSeconds = parseInt(retryAfter, 10);
            if (!isNaN(retryAfterSeconds)) {
              delayTime = Math.max(delayTime, retryAfterSeconds * 1000);
            } else {
              const retryAfterDate = new Date(retryAfter).getTime();
              if (!isNaN(retryAfterDate)) {
                const currentTime = Date.now();
                delayTime = Math.max(delayTime, retryAfterDate - currentTime);
              }
            }
          }
          await delay(delayTime);
        }
        return executeFetch();
      };
      const [error, response, result] = await retryRequest();
      if (!response.ok) {
        return [new Error(response.statusText), response, result];
      }
      return [error, response, result];
    };
    return async (sendOptions) => {
      const options = {
        ...initialOptions,
        ...cloneRecursive3(sendOptions)
      };
      if (initialOptions.headers) {
        options.headers = {
          ...initialOptions.headers,
          ...options.headers
        };
      }
      if (options.debounce) {
        await debounce(options.debounce);
      }
      if (options.delay) {
        await delay(options.delay);
      }
      if (options.throttle) {
        await throttle(options.throttle);
      }
      if (options.maxConcurrency && activeRequests >= options.maxConcurrency) {
        await new Promise((resolve) => {
          let interval = null;
          const wait = () => {
            if (activeRequests >= options.maxConcurrency) {
              interval = requestAnimationFrame(wait);
            } else {
              if (interval) {
                clearInterval(interval);
              }
              resolve(null);
            }
          };
          interval = requestAnimationFrame(wait);
        });
      }
      activeRequests++;
      const results = await sendRequest(options);
      activeRequests--;
      return results;
    };
  };
  // src/shared/utilities/clone.js
  var cloneRecursive4 = (value) => {
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        const clone = [];
        for (let i = 0;i < value.length; i++) {
          clone.push(cloneRecursive4(value[i]));
        }
        value = clone;
      } else {
        const clone = {};
        for (const key in value) {
          clone[key] = cloneRecursive4(value[key]);
        }
        value = clone;
      }
    }
    return value;
  };

  // src/shared/utilities/singleton.js
  var callOnce = (method) => {
    let called = false;
    let result = null;
    return () => {
      if (!called) {
        called = true;
        result = method();
      }
      return result;
    };
  };

  // src/shared/apis/anthropic.js
  var apiSettings = Object.freeze({
    code: "anthropic",
    name: "Anthropic",
    preferredModel: "claude-3-5-haiku-20241022",
    preferredModelName: "Claude 3.5 Haiku",
    requireCredentials: true,
    modelOptionsFilter: (model) => ![
      "(old)"
    ].some((keyword) => model.name.toLowerCase().includes(keyword))
  });
  var _createMessage = callOnce(() => create({
    credentials: "same-origin",
    domain: "https://api.anthropic.com",
    method: "post",
    mode: "cors",
    path: "/v1/messages",
    headers: {
      Accept: "application/json",
      "Access-Control-Allow-Origin": "*",
      "anthropic-dangerous-direct-browser-access": "true",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    }
  }));
  var createMessage = (state, messages, context = null, instructions = null) => {
    messages = cloneRecursive4(messages);
    if (instructions) {
      messages.unshift({
        role: "user",
        content: instructions
      });
    }
    return _createMessage()({
      headers: {
        "x-api-key": state.apiCredentials
      },
      body: {
        model: state.apiModel ?? apiSettings.preferredModel,
        messages,
        system: context,
        temperature: state.apiModelTemperature
      }
    }).then(([error, response, result]) => {
      if (!error) {
        result = {
          role: "assistant",
          content: result?.content?.[0].text
        };
      }
      return [error, response, result];
    });
  };
  var _getModels = callOnce(() => create({
    credentials: "same-origin",
    domain: "https://api.anthropic.com",
    mode: "cors",
    path: "/v1/models",
    headers: {
      Accept: "application/json",
      "Access-Control-Allow-Origin": "*",
      "anthropic-dangerous-direct-browser-access": "true",
      "anthropic-version": "2023-06-01"
    }
  }));
  var getModels = (state) => {
    return _getModels()({
      headers: {
        "x-api-key": state.apiCredentials
      }
    }).then(([error, response, result]) => {
      if (!error) {
        result.data = result.data.map((item) => ({
          ...item,
          name: item.display_name
        }));
      }
      return [error, response, result];
    });
  };

  // src/shared/apis/deepseek.js
  var apiSettings2 = Object.freeze({
    code: "deepseek",
    name: "DeepSeek",
    preferredModel: "deepseek-chat",
    requireCredentials: true
  });
  var _createMessage2 = callOnce(() => create({
    method: "post",
    domain: "https://api.deepseek.com",
    path: "/v1/chat/completions",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  }));
  var createMessage2 = (state, messages, context = null, instructions = null) => {
    messages = cloneRecursive4(messages);
    const prependAppRole = (message) => {
      if (message) {
        if (messages.length > 0 && messages[0].role === "system") {
          messages[0].content = message + " " + messages[0].content;
        } else {
          messages.unshift({
            role: "system",
            content: message
          });
        }
      }
    };
    prependAppRole(instructions);
    prependAppRole(context);
    return _createMessage2()({
      headers: {
        Authorization: "Bearer " + state.apiCredentials
      },
      body: {
        messages,
        model: state.apiModel ?? apiSettings2.preferredModel,
        temperature: state.apiModelTemperature * 2,
        user: state.userIdentifier
      }
    }).then(([error, response, result]) => {
      if (!error) {
        result = result?.choices?.[0]?.message;
      }
      return [error, response, result];
    });
  };
  var _getModels2 = callOnce(() => create({
    domain: "https://api.deepseek.com",
    path: "/v1/models",
    headers: {
      Accept: "application/json"
    }
  }));
  var getModels2 = (state) => _getModels2()({
    headers: {
      Authorization: "Bearer " + state.apiCredentials
    }
  });

  // src/shared/apis/google.js
  var apiSettings3 = Object.freeze({
    code: "google",
    name: "Google AI",
    preferredModel: "gemini-3-flash-preview",
    preferredModelName: "Gemini 3 Pro Preview",
    requireCredentials: true,
    modelOptionsFilter: (model) => ![
      "aqa",
      "audio",
      "banana",
      "bison",
      "embedding",
      "image",
      "learnlm",
      "tts",
      "veo",
      "vision",
      "1.0",
      "1.5"
    ].some((keyword) => model.id.toLowerCase().includes(keyword)) && !model.id.match(/-(?:\d){3,4}$/) && !model.id.match(/-(?:\d){2}-(?:\d){2}$/)
  });
  var getModelData = (state) => {
    if (state.apiModels?.data?.length > 0) {
      return state.apiModels.data.find((modelData) => modelData.id === state.apiModel);
    }
    return null;
  };
  var _createMessage3 = callOnce(() => create({
    domain: "https://generativelanguage.googleapis.com",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method: "post"
  }));
  var createMessage3 = (state, messages, context = null, instructions = null) => {
    messages = cloneRecursive4(messages);
    const modelData = getModelData(state);
    return _createMessage3()({
      path: "/v1beta/models/" + (state.apiModel ?? apiSettings3.preferredModel) + ":generateContent?key=" + state.apiCredentials,
      body: {
        contents: messages.length > 0 ? messages.map((message) => ({
          parts: [{
            text: message.content
          }],
          role: message.role === "assistant" ? "model" : "user"
        })) : { parts: { text: "" } },
        system_instruction: context || instructions ? {
          parts: [context, instructions].filter((text) => text).map((text) => ({
            text
          }))
        } : undefined,
        generationConfig: {
          temperature: state.apiModelTemperature * modelData.maxTemperature
        }
      }
    }).then(([error, response, result]) => {
      if (!error) {
        result = {
          content: result?.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" "),
          role: "assistant"
        };
      }
      return [error, response, result];
    });
  };
  var _getModels3 = callOnce(() => create({
    domain: "https://generativelanguage.googleapis.com",
    headers: {
      Accept: "application/json"
    }
  }));
  var getModels3 = (state) => _getModels3()({
    path: "/v1beta/models?pageSize=1000&key=" + state.apiCredentials
  }).then(([error, response, result]) => {
    if (!error) {
      result = {
        data: result.models.map((model) => ({
          ...model,
          id: model.name.split("/").pop(),
          name: model.displayName
        }))
      };
    }
    return [error, response, result];
  });

  // src/shared/apis/open-ai.js
  var apiSettings4 = Object.freeze({
    code: "open_ai",
    name: "OpenAI",
    preferredModel: "gpt-5-mini",
    requireCredentials: true,
    modelOptionsFilter: (model) => ![
      "-audio",
      "-codex",
      "-embedding",
      "-image",
      "-moderation",
      "-search",
      "-transcribe",
      "-tts",
      "babbage-",
      "dall-e-",
      "davinci-",
      "sora-",
      "tts-",
      "whisper-"
    ].some((keyword) => model.id.toLowerCase().includes(keyword)) && !model.id.match(/-(?:\d){4}$/) && !model.id.match(/-(?:\d){4}-(?:\d){2}-(?:\d){2}$/)
  });
  var _createMessage4 = callOnce(() => create({
    method: "post",
    domain: "https://api.openai.com",
    path: "/v1/responses",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  }));
  var createMessage4 = (state, messages, context = null, instructions = null) => {
    messages = messages.map((message) => {
      message = cloneRecursive4(message);
      message.type = "message";
      return message;
    });
    return _createMessage4()({
      headers: {
        Authorization: "Bearer " + state.apiCredentials
      },
      body: {
        input: messages,
        instructions: context + `
` + instructions,
        model: state.apiModel ?? apiSettings4.preferredModel,
        prompt_cache_key: state.userIdentifier,
        safety_identifier: state.userIdentifier,
        temperature: state.apiModelTemperature * 2
      }
    }).then(([error, response, result]) => {
      if (!error) {
        result = {
          role: "assistant",
          content: result?.output?.[0]?.content?.map((entry) => entry.text).join(`
`)
        };
      }
      return [error, response, result];
    });
  };
  var _getModels4 = callOnce(() => create({
    domain: "https://api.openai.com",
    path: "/v1/models",
    headers: {
      Accept: "application/json"
    }
  }));
  var getModels4 = (state) => _getModels4()({
    headers: {
      Authorization: "Bearer " + state.apiCredentials
    }
  });

  // src/shared/apis/open-router.js
  var apiSettings5 = Object.freeze({
    code: "open_router",
    name: "Open Router",
    preferredModel: "deepseek/deepseek-chat:free",
    requireCredentials: true
  });
  var _createMessage5 = callOnce(() => create({
    method: "post",
    domain: "https://openrouter.ai",
    path: "/api/v1/responses",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  }));
  var createMessage5 = (state, messages, context = null, instructions = null) => {
    messages = messages.map((message) => {
      message = cloneRecursive4(message);
      message.type = "message";
      return message;
    });
    return _createMessage5()({
      headers: {
        Authorization: "Bearer " + state.apiCredentials
      },
      body: {
        input: messages,
        instructions: context + `
` + instructions,
        model: state.apiModel ?? apiSettings5.preferredModel,
        prompt_cache_key: state.userIdentifier,
        safety_identifier: state.userIdentifier,
        temperature: state.apiModelTemperature * 2
      }
    }).then(([error, response, result]) => {
      if (!error) {
        result = {
          role: "assistant",
          content: result?.output?.[0]?.content?.map((entry) => entry.text).join(`
`)
        };
      }
      return [error, response, result];
    });
  };
  var _getModels5 = callOnce(() => create({
    domain: "https://openrouter.ai",
    path: "/api/v1/models",
    headers: {
      Accept: "application/json"
    }
  }));
  var getModels5 = (state) => _getModels5()({
    headers: {
      Authorization: "Bearer " + state.apiCredentials
    }
  });

  // src/shared/apis/apis.js
  var APIS = Object.freeze({
    [apiSettings.code]: apiSettings,
    [apiSettings2.code]: apiSettings2,
    [apiSettings3.code]: apiSettings3,
    [apiSettings4.code]: apiSettings4,
    [apiSettings5.code]: apiSettings5
  });
  var callApi = (lookupTable, state, ...parameters) => {
    let method = null;
    if (state.apiProvider) {
      method = lookupTable[state.apiProvider];
    }
    if (method) {
      return method(state, ...parameters);
    }
    return Promise.resolve([new Error("No api selected, or function not supported."), null, null]);
  };
  var createMessage6 = (state, messages, context = null, instructions = null) => callApi({
    [apiSettings.code]: createMessage,
    [apiSettings2.code]: createMessage2,
    [apiSettings3.code]: createMessage3,
    [apiSettings4.code]: createMessage4,
    [apiSettings5.code]: createMessage5
  }, state, messages, context, instructions);
  var getModels6 = (state) => callApi({
    [apiSettings.code]: getModels,
    [apiSettings2.code]: getModels2,
    [apiSettings3.code]: getModels3,
    [apiSettings4.code]: getModels4,
    [apiSettings5.code]: getModels5
  }, state);
  var isReady = (state) => {
    return state.apiProvider && APIS[state.apiProvider] && (!APIS[state.apiProvider]?.requireCredentials || state.apiCredentialsTested) && (state.apiModel ?? APIS[state.apiProvider].preferredModel) && state.apiModels?.data?.some((model) => model.id === (state.apiModel ?? APIS[state.apiProvider].preferredModel));
  };

  // src/toaln/data/locales.js
  var LOCALES = Object.freeze({
    dan: "dan",
    deu: "deu",
    eng: "eng",
    epo: "epo",
    fra: "fra",
    fry: "fry",
    isl: "isl",
    ita: "ita",
    nld: "nld",
    nno: "nno",
    nob: "nob",
    por: "por",
    spa: "spa",
    swe: "swe",
    vls: "vls"
  });
  var LOCALE_CODES = Object.keys(LOCALES);
  var getLanguageFromLocale = (localeCode) => (localeCode ?? "").split("_")[0].split("-")[0];
  var getPreferredLocale = () => window.navigator.languages.map((languageCode) => languageCode.split("-").filter((_segment, index) => index < 2).join("-").replace("-", "_").toLowerCase()).reduce((preferredLanguage, languageCode) => {
    if (preferredLanguage) {
      return preferredLanguage;
    }
    for (let i = 0;i < LOCALE_CODES.length; i++) {
      const possibleLanguage = LOCALE_CODES[i];
      if (languageCode === possibleLanguage) {
        return possibleLanguage;
      }
      if (possibleLanguage.startsWith(languageCode + "_")) {
        return possibleLanguage;
      }
    }
    return preferredLanguage;
  }, null) ?? LOCALES.eng;
  var setLangAttribute = (state) => {
    document.documentElement.setAttribute("lang", state.sourceLocale);
  };
  var PROFICIENCY_LEVELS = Object.freeze({
    a1: "a1",
    a2: "a2",
    b1: "b1",
    b2: "b2",
    c1: "c1",
    c2: "c2"
  });
  var PROFICIENCY_LEVEL_CODES = Object.keys(PROFICIENCY_LEVELS);

  // src/toaln/data/screens.js
  var SCREENS = Object.freeze({
    clarification: "clarification",
    comprehension: "comprehension",
    conversation: "conversation",
    reading: "reading",
    rewrite: "rewrite",
    story: "story",
    vocabulary: "vocabulary",
    typing: "typing",
    overview: "overview",
    options: "options",
    migrate: "migrate",
    setup: "setup",
    profile: "profile"
  });

  // src/toaln/data/state.js
  var STORAGE_KEY = "toaln:state";

  // src/toaln/data/profile.js
  var PROFILE_TEMPLATE = {
    id: null,
    targetLanguage: "eng",
    proficiencyLevel: "a1",
    topicsOfInterest: [],
    clarificationInput: "",
    clarificationError: false,
    clarificationPending: false,
    clarificationMessages: [],
    comprehensionInput: "",
    comprehensionReviewed: false,
    comprehensionError: false,
    comprehensionPending: false,
    comprehensionMessages: [],
    conversationInput: "",
    conversationStopped: false,
    conversationError: false,
    conversationPending: false,
    conversationMessages: [],
    readingInput: "",
    readingError: false,
    readingPending: false,
    readingMessages: [],
    rewriteInput: "",
    rewriteError: false,
    rewritePending: false,
    rewriteMessages: [],
    storyInput: "",
    storyReviewed: false,
    storyError: false,
    storyPending: false,
    storyMessages: [],
    typingCurrentIndex: 0,
    typingEndTime: null,
    typingError: false,
    typingInput: "",
    typingLength: "medium",
    typingMessage: [],
    typingMistakes: 0,
    typingPending: false,
    typingStartTime: null,
    vocabularyInput: "",
    vocabularyReviewed: false,
    vocabularyError: false,
    vocabularyPending: false,
    vocabularyMessages: []
  };
  var generateProfileName = (state, profile, maxLength = Infinity) => {
    const languageName = translate(state, profile.targetLanguage);
    let name = languageName + " " + profile.proficiencyLevel.toUpperCase();
    if (profile.topicsOfInterest?.length > 0) {
      name += " (" + profile.topicsOfInterest.join(", ") + ")";
    }
    if (maxLength !== Infinity && name.length > maxLength) {
      name = name.substring(0, maxLength) + "…";
    }
    return name;
  };
  var getActiveProfile = (state) => {
    let profile = state.profiles.find((profile2) => profile2.id === state.activeProfileId);
    if (!profile) {
      if (state.profiles.length > 0) {
        profile = state.profiles[0];
      } else {
        const profileId = createIdentifier();
        profile = cloneRecursive(PROFILE_TEMPLATE);
        profile.id = profileId;
        if (state.targetLanguage) {
          profile.targetLanguage = state.targetLanguage;
        }
        if (state.proficiencyLevel) {
          profile.proficiencyLevel = state.proficiencyLevel;
        }
        if (state.topicsOfInterest) {
          profile.topicsOfInterest = state.topicsOfInterest;
        }
        state.profiles.push(profile);
        state.activeProfileId = profileId;
      }
    }
    return profile;
  };

  // src/toaln/data/translations.js
  var translate = (state, key, locale = null) => {
    locale ??= state.sourceLocale;
    if (!(locale in TRANSLATIONS)) {
      console.warn('There are no translations available for the language "' + locale + '".');
      return key;
    }
    if (!(key in TRANSLATIONS[locale])) {
      console.warn('There are no translations available for the language "' + locale + '" with the key "' + key + '".');
      return key;
    }
    const replace = (text) => {
      if (!text) {
        return text;
      }
      if (Array.isArray(text)) {
        return text.map((item) => replace(item));
      }
      return text.replace("{%s:proficiencyLevel%}", () => {
        const profile = getActiveProfile(state);
        return profile.proficiencyLevel;
      }).replace("{%s:targetLanguage%}", () => {
        const profile = getActiveProfile(state);
        return profile.targetLanguage;
      }).replace(/{%s:([^%]+)%}/g, (match3, key2) => {
        let value = key2.split(".").reduce((innerState, keySegment) => innerState?.[keySegment], state);
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            return value.join(" ");
          }
          return value.toString();
        }
        return match3;
      }).replace(/{%t:([^%]+)%}/g, (match3, key2) => {
        if (key2 in TRANSLATIONS[locale]) {
          let value = TRANSLATIONS[locale][key2];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              return value.join(" ");
            }
            return value.toString();
          }
        }
        return match3;
      });
    };
    return replace(TRANSLATIONS[locale][key]);
  };
  var TRANSLATIONS = Object.freeze({
    [LOCALES.eng]: {
      [LOCALES.dan]: "Danish",
      [LOCALES.deu]: "German",
      [LOCALES.eng]: "English (UK)",
      [LOCALES.epo]: "Esperanto",
      [LOCALES.fra]: "French",
      [LOCALES.fry]: "Frisian (West)",
      [LOCALES.isl]: "Icelandic",
      [LOCALES.nld]: "Dutch",
      [LOCALES.nno]: "Norwegian (Nynorsk)",
      [LOCALES.nob]: "Norwegian (Bokmål)",
      [LOCALES.por]: "Portuguese",
      [LOCALES.spa]: "Spanish",
      [LOCALES.swe]: "Swedish",
      [LOCALES.ita]: "Italian",
      [LOCALES.vls]: "Flamish",
      "proficiency_name-a1": "A1: Beginner",
      "proficiency_description-a1": [
        "Reading: You can understand familiar names, words and very simple sentences, for example on notices and posters or in catalogues.",
        "Writing: You can write a short, simple postcard, for example sending holiday greetings. You can fill in forms with personal details, for example entering my name, nationality and address on a hotel registration form."
      ],
      "proficiency_example-a1": '"Hello! My name is Maria. I live in a small house in London with my family. I have one brother and one sister. I like to eat apples and pears. What is your favourite fruit?"',
      "proficiency_name-a2": "A2: Pre-intermediate",
      "proficiency_description-a2": [
        "Reading: You can read very short, simple texts. You can find specific, predictable information in simple everyday material such as advertisements, prospectuses, menus and timetables and you can understand short simple personal letters.",
        "Writing: You can write short, simple notes and messages relating to matters in areas of immediate needs. You can write a very simple personal letter, for example thanking someone for something."
      ],
      "proficiency_example-a2": '"Last weekend, I went to the park with my friends. We had a picnic with sandwiches and juice. The weather was sunny, and we played football. After that, we went to a café and had some ice cream. It was a fun day!"',
      "proficiency_name-b1": "B1: Intermediate",
      "proficiency_description-b1": [
        "Reading: You can understand texts that consist mainly of high frequency every day or job-related language. You can understand the description of events, feelings and wishes in personal letters.",
        "Writing: You can write simple connected text on topics which are familiar or of personal interest. You can write personal letters describing experiences and impressions."
      ],
      "proficiency_example-b1": `"I enjoy reading books, especially mystery novels. Recently, I finished a story about a detective who solved a difficult case. It was very interesting, and I couldn't stop reading. I like mysteries because they make me think and try to guess the ending."`,
      "proficiency_name-b2": "B2: Upper-intermediate",
      "proficiency_description-b2": [
        "Reading: You can read articles and reports concerned with contemporary problems in which the writers adopt particular attitudes or viewpoints. You can understand contemporary literary prose.",
        "Writing: You can write clear, detailed text on a wide range of subjects related to my interests. You can write an essay or report, passing on information or giving reasons in support of or against a particular point of view. You can write letters highlighting the personal significance of events and experiences."
      ],
      "proficiency_example-b2": '"The concept of remote work has become increasingly popular in recent years. It offers flexibility and convenience for employees, allowing them to work from anywhere. However, it also presents challenges, such as maintaining productivity and communication with colleagues. Overall, I think the benefits outweigh the drawbacks."',
      "proficiency_name-c1": "C1: Advanced",
      "proficiency_description-c1": [
        "Reading: You can understand long and complex factual and literary texts, appreciating distinctions of style. You can understand specialised articles and longer technical instructions, even when they do not relate to your field.",
        "Writing: You can express yourself in clear, well-structured text, expressing points of view at some length. You can write about complex subjects in a letter, an essay or a report, underlining what you consider to be the salient issues. You can select style appropriate to the reader in mind."
      ],
      "proficiency_example-c1": '"Climate change is one of the most pressing issues of our time. While renewable energy sources such as wind and solar power are growing in importance, transitioning away from fossil fuels remains a significant challenge. Governments must collaborate with industries and communities to create sustainable policies that balance economic growth with environmental conservation."',
      "proficiency_name-c2": "C2: Proficient",
      "proficiency_description-c2": [
        "Reading: You can read with ease virtually all forms of the written language, including abstract, structurally or linguistically complex texts such as manuals, specialised articles and literary works.",
        "Writing: You can write clear, smoothly-flowing text in an appropriate style. You can write complex letters, reports or articles which present a case with an effective logical structure which helps the recipient to notice and remember significant points. You can write summaries and reviews of professional or literary works."
      ],
      "proficiency_example-c2": '"The nuances of linguistic evolution reveal much about cultural and societal shifts over time. For instance, the adoption of loanwords often signals a period of cultural exchange or influence. Analysing such patterns not only enhances our understanding of language development but also offers profound insights into historical relationships between civilizations. This dynamic interplay underscores the complexity and interconnectedness of human communication."',
      "prompt-context": 'You are an expert in and teacher of {%t:{%s:targetLanguage%}%}. The user is studying {%t:{%s:targetLanguage%}%}. The user already masters the language at CEFR level {%s:proficiencyLevel%}. This means that the user already has the following skills: "{%t:proficiency_description-{%s:proficiencyLevel%}%}". However, the user wants to improve their proficiency further.',
      "prompt-comprehension": "Write a reading and writing exercise where the user receives a text in {%t:{%s:targetLanguage%}%} along with a question in {%t:{%s:sourceLocale%}%} about the text, to which the user must respond in {%t:{%s:targetLanguage%}%}. Do not provide any further instructions, explanations, or answers to the user. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-comprehension-follow_up": "Provide feedback on the reading and writing exercise given. Offer concise feedback on the {%t:{%s:targetLanguage%}%} with in-depth analysis that is clear enough for the user's level of knowledge. Write the feedback in {%t:{%s:sourceLocale%}%}. Focus exclusively on linguistic aspects and ignore content-related evaluations or interpretations of the message. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-conversation": "You will simulate a conversation with the user in {%t:{%s:targetLanguage%}%}. Do not provide any further instructions or explanations to the user. Always write in plain text without any formatting, labels, headings, or lists. Write the first message in the conversation, immediately introducing a topic to discuss.",
      "prompt-conversation-follow_up": "You are simulating a conversation with the user in {%t:{%s:targetLanguage%}%}. First, provide brief, in-depth feedback on the message in {%t:{%s:sourceLocale%}%}, focusing solely on linguistic aspects and ignoring any content-related evaluations or interpretations. Then, respond to the message in {%t:{%s:targetLanguage%}%}. Do not provide any further instructions or explanations to the user. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-clarification": "The user has a question below, answer it concisely with in-depth feedback, appropriate to the user's proficiency level. Answer the question {%t:{%s:sourceLocale%}%} and provide examples in {%t:{%s:targetLanguage%}%} where appropriate. Always write in plain text without any formatting, labels, headings, or lists. Do not answer the question if it is not language-related.",
      "prompt-reading": "Write a text in {%t:{%s:targetLanguage%}%}, but for every paragraph written write the same paragraph below in {%t:{%s:sourceLocale%}%} as well. Don't output any content in regards to the users learning journey, focus on creating a enjoyable text to practise reading. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-reading-topic": "The generate text should be about the following topic:",
      "prompt-rewrite": "Rewrite the user provided text into {%t:{%s:targetLanguage%}%} at the users CEFR level of {%s:proficiencyLevel%}. Ensure no information is lost when translating. Always write in plain text without any additional commentary.",
      "prompt-story": "You and the user will collaboratively write a story by taking turns adding sections. Begin by writing the first section of the story in {%t:{%s:targetLanguage%}%}, introducing an engaging theme or setting. Focus on having fun and practising the language. Do not include any additional instructions, explanations, formatting, labels, or headings.",
      "prompt-story-follow_up": "You are continuing the collaborative story-writing session with the user. First, provide concise, in-depth feedback in {%t:{%s:sourceLocale%}%} on the user's latest section, focusing solely on linguistic aspects and suggesting improvements. Avoid any comments about the story's plot, logic, or content. Then, add your next section of the story in {%t:{%s:targetLanguage%}%}. Write your response in plain text without any formatting, labels, or headings.",
      "prompt-topic": ' Incorporate the following topic into your message "{%topic%}".',
      "prompt-vocabulary": "Write a word in {%t:{%s:targetLanguage%}%} along with its definition in {%t:{%s:sourceLocale%}%}. The user will then write a sentence in {%t:{%s:targetLanguage%}%} in which this word must be used. Take into account the user's skill and language level. Do not provide any additional instructions, explanations, or the answer to the user. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-vocabulary-follow_up": "Provide feedback on the sentence in which the user has answered. Check whether the word has been used correctly in the sentence. Provide concise feedback on the {%t:{%s:targetLanguage%}%} with considerable depth that is clear enough for the user's level of knowledge. Write the feedback in {%t:{%s:sourceLocale%}%}. Focus exclusively on linguistic aspects and ignore content-related evaluations or interpretations of the message. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-typing": "Write a text in {%t:{%s:targetLanguage%}%}. The text should be suitable for typing practice. Use common words appropriate for the user's skill and language level. Avoid special characters. The text should be {%typingLength%} in length. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-translate": "The user has requested a translation of the selected text. Translate all the {%t:{%s:sourceLocale%}%} into {%t:{%s:targetLanguage%}%} and {%t:{%s:targetLanguage%}%} into {%t:{%s:sourceLocale%}%}. Do not provide any further instructions or explanations to the user. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-translate-user": 'Translate the selected text in {%t:{%s:sourceLocale%}%}. The user has selected the following text: "{%s:selection.text%}".',
      "prompt-translate-context": 'It was selected from the context: "{%s:selection.context%}". Translate only the selected text and not the entire context.',
      "prompt-explain": "The users has requested an explanation of the text. Delve into all the details of the text and provide a clear and concise explanation. Provide additional examples if it fits the explanation. Always write in plain text without any formatting, labels, headings, or lists.",
      "prompt-explain-user": 'Explain the selected text in {%t:{%s:sourceLocale%}%}. The user has selected the following text: "{%s:selection.text%}".',
      "prompt-explain-context": 'It was selected from the context: "{%s:selection.context%}". Explain only the selected text and not the entire context.',
      greeting: "Hi!",
      "credits-link": "Made by {%name%}",
      "button-answer": "Answer",
      "button-ask": "Ask",
      "button-close": "Close",
      "button-generate": "Generate",
      "button-go_back": "Go back",
      "button-reload": "Reload",
      "button-reply": "Reply",
      "button-reset": "Reset",
      "button-rewrite": "Rewrite",
      "context-translate": "Translate selection",
      "context-explain": "Explain selection",
      "context-copy": "Copy selection",
      select_an_option: "Select an option",
      "api_model-temperature_none": "None",
      "api_model-temperature_low": "Low",
      "api_model-temperature_medium": "Average",
      "api_model-temperature_high": "High",
      "banner-update_now": "There is an update available, click here to update now!",
      "popup-explain": "Explain the text below:",
      "popup-translate": "Translate the text below:",
      "setup-source_language": "So, you want to improve your proficiency in a language? Let this app help you practise. We need to start by choosing a language you already know.",
      "setup-target_language": "Now the next step, which language would you like to learn?",
      "setup-proficiency_level": "How proficient would you say you already are in the language? See the explanation below along with an example text to get an idea of what kind of texts to expect.",
      "setup-topics_of_interest": "It's much more enjoyable if the exercises sometimes feature a topic you find interesting. Therefore, fill in a few topics below that can regularly appear. Think mainly of any hobbies or other interests. The more, the better!",
      "setup-api_provider": `This app uses a "Large Language Model" to generate and assess exercises. You may have heard about it, everyone in the tech sector keeps talking about developments in artificial intelligence. The app uses an LLM, but doesn't come with one, so we need to link it to an LLM provider. Which provider would you like to use?`,
      "setup-api_credentials": "Now, the important question is the key. You can get it from the developer's dashboard. It probably states that you shouldn't share it with third parties. Fortunately, this app never sends the key elsewhere. Still not convinced? Check out the app's source code or wait for a version that no longer requires this.",
      "setup-test_api_credentials": "Test key",
      "setup-api_credentials_untested": "Test the credentials before proceeding.",
      "setup-api_credentials_tested": 'The provided key works. Now you can choose which "Large Language Model" to use. Not sure what the differences are? No problem, we recommend selecting "{%preferredModel%}". That should be fine.',
      "setup-outro": "Good luck and have fun!",
      "setup-next": "Start practising",
      "overview-current_profile": "With which profile would you like to practise?",
      "overview-intro": "What would you like to do?",
      "overview-clarification-description": "Get explanations about {%t:{%s:targetLanguage%}%}, such as a grammar rule like conjugations or cases.",
      "overview-clarification-title": "Ask for clarification",
      "overview-comprehension-description": "You'll receive a short text along with a question to answer.",
      "overview-comprehension-title": "Answer questions",
      "overview-conversation-description": "A short conversation will be simulated, for example about ordering food or discussing a hobby.",
      "overview-conversation-title": "Practise conversations",
      "overview-migrate-description": "Export, import or reset your data.",
      "overview-migrate-title": "Manage data",
      "overview-options-description": "Change the language you want to learn, the topics you find interesting, or the LLM used.",
      "overview-options-title": "Change settings",
      "overview-reading-description": "You can generate a text where each paragraph is available in both languages.",
      "overview-reading-title": "Read texts",
      "overview-rewrite-description": "You can let the LLM rewrite a text into {%t:{%s:targetLanguage%}%} at your proficiency level.",
      "overview-rewrite-title": "Rewrite texts",
      "overview-story-description": "You'll take turns writing a story piece by piece.",
      "overview-story-title": "Write a story",
      "overview-vocabulary-description": "You'll receive a word together with its definition, you then respond with a with a sentence using that word.",
      "overview-vocabulary-title": "Learn words",
      "options-source_language": "Which language do you already know?",
      "options-profile_management": "Below you can see a list of profiles. With the edit and delete buttons you can manage these.",
      "options-select_profile": "With which profile would you like to practise?",
      "options-profile_delete": "Delete",
      "options-profile_update": "Edit",
      "options-profile_add": "Add new profile",
      "options-api_provider": 'This app uses a "Large Language Model" to generate and assess exercises. Which provider would you like to link?',
      "options-api_credentials": "Enter the key from the developer's dashboard.",
      "options-test_api_credentials": "Test key",
      "options-api_credentials_untested": "Test the credentials before proceeding.",
      "options-api_credentials_tested": 'The provided key works. Choose a "Large Language Model" to use, we recommend "{%preferredModel%}".',
      "options-api_model_advanced_settings": "Advanced model settings",
      "options-api_model_temperature-select": "What should the text variability be? Increasing the variability creates more creative and diverse output, but setting it too high can result in gibberish. The default value is 0.5.",
      "profile-target_language": "Which language would you like to learn?",
      "profile-proficiency_level": "How proficient are you in the language? See the explanation below along with an example text to get an idea of what kind of texts to expect.",
      "profile-topics_of_interest": "Fill in a few topics below that can regularly appear in the exercises.",
      "migrate-export": "Export the data the app has stored. It is important to note the export does not contain the API key used to access an LLM provider. When importing data this will need to be applied again.",
      "migrate-export_button": "Download your data",
      "migrate-import": "Import previously exported data. When an import has been done it cannot be undone, so be careful! It is recommended to export your existing data before overwriting it with a new import. After the import has been successful you will be brought back to the setup screen with the import applied.",
      "migrate-import_button": "Upload your data",
      "migrate-reset": "Remove all the data and reset the app. Once performed this action can not be undone.",
      "migrate-reset_button": "Reset",
      "migrate-reset_button-confirmation": "I confirm that I am absolutely certain I want to reset!",
      "statistics-activity_per_category": "You have already read {%s:statisticReadingActivity%} texts, let {%s:statisticRewriteActivity%} texts be rewritten, answered {%s:statisticComprehensionActivity%} questions, {%s:statisticVocabularyActivity%} words practised, typed out {$s:statisticTypingActivity$} texts, sent {%s:statisticConversationActivity%} messages, told {%s:statisticStoryActivity%} stories, and asked {%s:statisticClarificationActivity%} questions.",
      "statistics-no_activity": "Unfortunately, you haven't completed enough activities yet to display here. Go to the overview and choose an exercise to start. Your progress will be tracked in the background.",
      "statistics-no_activity_streak": "Currently you have no ongoing activity streak. You can build one by completing at least one exercise on consecutive days.",
      "statistics-current_activity_streak": "Your current activity streak is {%s:statisticCurrentActivityStreak%} days long. Don't loose it and practise before midnight to extend it!",
      "statistics-extended_activity_streak": "Good job, you extended your streak for today! Your current activity streak is {%s:statisticCurrentActivityStreak%} days long.",
      "statistics-longest_activity_streak": "Your longest activity streak ever was {%s:statisticLongestActivityStreak%} days long.",
      "clarification-intro": "What would you like more information about?",
      "clarification-placeholder": "I'm wondering about...",
      "comprehension-intro": "In a moment you'll read a text in {%t:{%s:targetLanguage%}%} along with a question about it. Answer the question in {%t:{%s:targetLanguage%}%}. You'll then receive some feedback regarding your answer.",
      "conversation-intro": "In a moment you'll simulate a conversation in {%t:{%s:targetLanguage%}%}, so always respond in {%t:{%s:targetLanguage%}%}. You may receive feedback along the way.",
      "reading-intro": "You will be reading a text where each paragraph is written in both {%t:{%s:targetLanguage%}%} and {%t:{%s:sourceLanguage%}%} allowing you to practise your reading. You can optionally provide a topic for the text to be about.",
      "reading-placeholder": "I want to read about...",
      "rewrite-intro": "You can enter in a text below. The LLM will ensure the text is in {%t:{%s:sourceLanguage%}%} at your selected proficiency level.",
      "rewrite-placeholder": "I want to let rewrite...",
      "story-intro": "You're about to write a story in {%t:{%s:targetLanguage%}%} where, in turns, you add a piece. Don't worry about whether the story is good, logical, or well-founded; just make sure you practice the language. Therefore, always respond in {%t:{%s:targetLanguage%}%}. In between, you might receive some feedback on your writing.",
      "vocabulary-intro": "In a moment you'll read a word together with its definition in {%t:{%s:targetLanguage%}%}. Answer with a scentence that uses the word in {%t:{%s:targetLanguage%}%}. You'll then receive some feedback regarding your answer.",
      "typing-intro": "You're about to retype a text in in {%t:{%s:targetLanguage%}%} below. The cursor will advance as you type each character correctly. You can specify a topic for as well as the length of the text below.",
      "typing-completed": "Exercise completed!",
      "typing-placeholder": "I want to type about...",
      "typing-results-summary": "The text consists of {%words%} words and {%characters%} characters. You typed the text in {%minutes%} minutes and {%seconds%} seconds, which means you typed at an average of {%wpm%} words per minute. You made {%mistakes%} mistakes, resulting in an accuracy of {%accuracy%}%.",
      "typing-restart": "Restart",
      "typing-length-select": "Text length",
      "typing-length-short": "Short (≈50 words)",
      "typing-length-medium": "Medium (≈100 words)",
      "typing-length-long": "Long (≈200 words)",
      "typing-length-extra_long": "Extra long (≈400 words)",
      "overview-typing-title": "Practise typing",
      "overview-typing-description": "Improve your typing speed and accuracy in {%t:{%s:targetLanguage%}%}."
    },
    [LOCALES.nld]: {
      [LOCALES.dan]: "Deens",
      [LOCALES.deu]: "Duits",
      [LOCALES.eng]: "Engels (VK)",
      [LOCALES.epo]: "Esperanto",
      [LOCALES.fra]: "Frans",
      [LOCALES.fry]: "Fries (West)",
      [LOCALES.isl]: "IJslands",
      [LOCALES.ita]: "Italiaans",
      [LOCALES.nld]: "Nederlands",
      [LOCALES.nno]: "Noors (Nynorsk)",
      [LOCALES.nob]: "Noors (Bokmål)",
      [LOCALES.por]: "Portugees",
      [LOCALES.spa]: "Spaans",
      [LOCALES.swe]: "Zweeds",
      [LOCALES.vls]: "Vlaams",
      "proficiency_name-a1": "A1: Beginner",
      "proficiency_description-a1": [
        "Lezen: Je kunt vertrouwde namen, woorden en zeer eenvoudige zinnen begrijpen, bijvoorbeeld op aankondigingen en posters of in catalogi.",
        "Schrijven: Je kunt een korte, eenvoudige ansichtkaart schrijven, bijvoorbeeld om vakantiegroeten te sturen. Je kunt formulieren invullen met persoonlijke gegevens, zoals je naam, nationaliteit en adres op een hotelregistratieformulier."
      ],
      "proficiency_example-a1": '"Hallo! Ik heet Maria. Ik woon in een klein huis in Amsterdam met mijn familie. Ik heb een broer en een zus. Ik hou van appels en peren. Wat is jouw favoriete fruit?"',
      "proficiency_name-a2": "A2: Pre-intermediair",
      "proficiency_description-a2": [
        "Lezen: Je kunt zeer korte, eenvoudige teksten lezen. Je kunt specifieke, voorspelbare informatie vinden in eenvoudig alledaags materiaal zoals advertenties, folders, menu's en dienstregelingen, en je kunt korte eenvoudige persoonlijke brieven begrijpen.",
        "Schrijven: Je kunt korte, eenvoudige notities en berichten schrijven die betrekking hebben op zaken van directe noodzaak. Je kunt een heel eenvoudige persoonlijke brief schrijven, bijvoorbeeld om iemand te bedanken."
      ],
      "proficiency_example-a2": '"Afgelopen weekend ging ik met mijn vrienden naar het park. We hadden een picknick met broodjes en sap. Het weer was zonnig, en we speelden voetbal. Daarna gingen we naar een café en aten we ijs. Het was een leuke dag!"',
      "proficiency_name-b1": "B1: Intermediair",
      "proficiency_description-b1": [
        "Lezen: Je kunt teksten begrijpen die voornamelijk bestaan uit alledaagse of werkgerelateerde taal met een hoge frequentie. Je kunt de beschrijving van gebeurtenissen, gevoelens en wensen begrijpen in persoonlijke brieven.",
        "Schrijven: Je kunt eenvoudige, samenhangende teksten schrijven over onderwerpen die vertrouwd of van persoonlijk belang zijn. Je kunt persoonlijke brieven schrijven waarin je ervaringen en indrukken beschrijft."
      ],
      "proficiency_example-b1": '"Ik lees graag boeken, vooral detectiveverhalen. Onlangs heb ik een verhaal gelezen over een rechercheur die een moeilijk mysterie oploste. Het was erg interessant, en ik kon niet stoppen met lezen. Ik hou van dit genre omdat het me aan het denken zet en ik probeer het einde te raden."',
      "proficiency_name-b2": "B2: Upper-intermediair",
      "proficiency_description-b2": [
        "Lezen: Je kunt artikelen en rapporten lezen die gaan over actuele problemen waarin de schrijvers specifieke houdingen of standpunten innemen. Je kunt eigentijdse literaire proza begrijpen.",
        "Schrijven: Je kunt duidelijke, gedetailleerde teksten schrijven over een breed scala aan onderwerpen die verband houden met je interesses. Je kunt een essay of rapport schrijven waarin je informatie doorgeeft of redenen geeft ter ondersteuning of afwijzing van een bepaald standpunt. Je kunt brieven schrijven waarin je de persoonlijke betekenis van gebeurtenissen en ervaringen benadrukt."
      ],
      "proficiency_example-b2": `"Het concept van thuiswerken is de laatste jaren steeds populairder geworden. Het biedt flexibiliteit en gemak voor werknemers, waardoor ze overal kunnen werken. Maar het brengt ook uitdagingen met zich mee, zoals het behouden van productiviteit en communicatie met collega's. Over het algemeen denk ik dat de voordelen groter zijn dan de nadelen."`,
      "proficiency_name-c1": "C1: Gevorderd",
      "proficiency_description-c1": [
        "Lezen: Je kunt lange en complexe feitelijke en literaire teksten begrijpen en waarderen, waarbij je onderscheid maakt in stijl. Je kunt gespecialiseerde artikelen en langere technische instructies begrijpen, zelfs wanneer deze niet in je vakgebied liggen.",
        "Schrijven: Je kunt jezelf duidelijk en goed gestructureerd uitdrukken in tekst, waarbij je standpunten uitvoerig uiteenzet. Je kunt schrijven over complexe onderwerpen in een brief, essay of rapport, en daarbij benadrukken wat je als de belangrijkste kwesties beschouwt. Je kunt een stijl kiezen die geschikt is voor de beoogde lezer."
      ],
      "proficiency_example-c1": '"Klimaatverandering is een van de meest urgente problemen van deze tijd. Hoewel hernieuwbare energiebronnen zoals wind- en zonne-energie steeds belangrijker worden, blijft de overgang van fossiele brandstoffen een grote uitdaging. Overheden moeten samenwerken met industrieën en gemeenschappen om duurzame beleidsmaatregelen te creëren die economische groei en milieubescherming in balans brengen."',
      "proficiency_name-c2": "C2: Proficient",
      "proficiency_description-c2": [
        "Lezen: Je kunt vrijwel alle vormen van geschreven taal met gemak lezen, inclusief abstracte, structureel of taalkundig complexe teksten zoals handleidingen, gespecialiseerde artikelen en literaire werken.",
        "Schrijven: Je kunt heldere, vloeiende teksten schrijven in een passende stijl. Je kunt complexe brieven, rapporten of artikelen schrijven die een zaak presenteren met een effectieve logische structuur die de ontvanger helpt belangrijke punten op te merken en te onthouden. Je kunt samenvattingen en recensies schrijven van professionele of literaire werken."
      ],
      "proficiency_example-c2": '"De nuances van taalontwikkeling onthullen veel over culturele en maatschappelijke veranderingen door de tijd heen. Zo duidt de opname van leenwoorden vaak op een periode van culturele uitwisseling of invloed. Het analyseren van dergelijke patronen verrijkt niet alleen ons begrip van taalontwikkeling, maar biedt ook waardevolle inzichten in historische relaties tussen beschavingen. Deze dynamiek benadrukt de complexiteit en verbondenheid van menselijke communicatie."',
      "prompt-context": 'Je bent een expert in en docent van het {%t:{%s:targetLanguage%}%}. De gebruiker is {%t:{%s:targetLanguage%}%} aan het studeren. De gebruiker beheerst de taal al tot CEFR niveau {%s:proficiencyLevel%}. Dit betekend dat de gebruiker al de volgende vaardigheden beheerst: "{%t:proficiency_description-{%s:proficiencyLevel%}%}" Maar de gebruiker wil de taal nog beter leren beheersen.',
      "prompt-comprehension": "Schrijf een lees en schrijfvaardigheidsoefening waarbij de gebruiker een tekst in het {%t:{%s:targetLanguage%}%} krijgt samen met een vraag in het {%t:{%s:sourceLocale%}%} over de tekst waarop de gebruiker moet antwoorden in het {%t:{%s:targetLanguage%}%}. Geef geen verdere instructies, uitleg of het antwoord aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.",
      "prompt-comprehension-follow_up": "Geef feedback op de lees en schrijfvaardigheidsoefening die gesteld is. Geef beknopt feedback over het {%t:{%s:targetLanguage%}%} met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker. Schrijf de feedback in het {%t:{%s:sourceLocale%}%}. Richt je hierbij uitsluitend op taalkundige aspecten en negeer inhoudelijke evaluaties of interpretaties van het bericht. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.",
      "prompt-conversation": "Je gaat met de gebruiker een gesprek simuleren in het {%t:{%s:targetLanguage%}%}. Geef geen verdere instructies of uitleg aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten. Schrijf het eerste bericht in een gesprek dat al gelijk een onderwerp introduceert om het over te hebben.",
      "prompt-conversation-follow_up": "Je bent met de gebruiker een gesprek aan het simuleren in het {%t:{%s:targetLanguage%}%}. Geef als antwoord op een bericht eerst beknopt feedback met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker in het {%t:{%s:sourceLocale%}%}. Richt je hierbij uitsluitend op taalkundige aspecten en negeer inhoudelijke evaluaties of interpretaties van het bericht. Ga daarna verder met het antwoorden op het bericht in het {%t:{%s:targetLanguage%}%}. Geef geen verdere instructies of uitleg aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.",
      "prompt-clarification": "De gebruiker heeft onderstaande vraag, beantwoord de vraag beknopt met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker. Beantwoord de vraag in het {%t:{%s:sourceLocale%}%} geef voorbeelden in het {%t:{%s:targetLanguage%}%} waar nodig. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten. Beantwoord de vraag niet als het absoluut niet taal gerelateerd is.",
      "prompt-reading": "Schrijf een tekst in {%t:{%s:targetLanguage%}%}, maar schrijf na elke geschreven alinea dezelfde alinea eronder in {%t:{%s:sourceLocale%}%}. Geef geen inhoud weer die betrekking heeft op het leerproces van de gebruiker. Zorg voor het maken van een leuke tekst om het lezen mee te oefenen. Schrijf altijd in platte tekst zonder opmaak, labels of kopjes.",
      "prompt-reading-topic": "De gegenereerde tekst moet over het volgende onderwerp gaan:",
      "prompt-rewrite": "Herschrijf de door de gebruiker verstrekte tekst in {%t:{%s:targetLanguage%}%} op het CEFR-niveau {%s:proficiencyLevel%}. Zorg ervoor dat er geen informatie verloren gaat tijdens het vertalen. Schrijf altijd in platte tekst zonder extra commentaar.",
      "prompt-story": "Jij en de gebruiker gaan samen een verhaal schrijven door om de beurt een gedeelte toe te voegen. Begin met het schrijven van de eerste sectie van het verhaal in {%t:{%s:targetLanguage%}%}, waarin je een boeiend thema of een interessante setting introduceert. Richt je op plezier hebben en het oefenen van de taal. Voeg geen extra instructies, uitleg, opmaak, labels of koppen toe.",
      "prompt-story-follow_up": "Je zet de gezamenlijke sessie voor het schrijven van een verhaal met de gebruiker voort. Geef eerst korte, diepgaande feedback in {%t:{%s:sourceLocale%}%} op de laatste bijdrage van de gebruiker, waarbij je je uitsluitend richt op taalkundige aspecten en suggesties voor verbetering geeft. Maak geen opmerkingen over de plot, logica of inhoud van het verhaal. Voeg daarna jouw volgende gedeelte van het verhaal toe in {%t:{%s:targetLanguage%}%}. Schrijf je antwoord in platte tekst zonder opmaak, labels of koppen.",
      "prompt-topic": ' Verwerk het volgende onderwerp in jouw bericht "{%topic%}".',
      "prompt-vocabulary": "Schrijf een woord in het {%t:{%s:targetLanguage%}%} samen met de definitie in het {%t:{%s:sourceLocale%}%}. De gebruiker zal vervolgens een zin in het {%t:{%s:targetLanguage%}%} schrijven waarin dit woord verwerkt moeten worden. Hou hierbij rekening met de vaardigheid en taalniveau van de gebruiker. Geef geen verdere instructies, uitleg of het antwoord aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.",
      "prompt-vocabulary-follow_up": "Geef feedback op de zin waarmee de gebruik antwoord heeft gegeven. Controleer of de woord juist gebruikt is in de zin. Geef beknopt feedback over het {%t:{%s:targetLanguage%}%} met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker. Schrijf de feedback in het {%t:{%s:sourceLocale%}%}. Richt je hierbij uitsluitend op taalkundige aspecten en negeer inhoudelijke evaluaties of interpretaties van het bericht. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.",
      "prompt-typing": "Schrijf een tekst in het {%t:{%s:targetLanguage%}%}. De tekst moet geschikt zijn voor type oefening. Gebruik veelvoorkomende woorden die passend zijn bij het vaardigheid en taalniveau van de gebruiker. Vermijd speciale tekens. De tekst moet {%typingLength%} zijn in lengte. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.",
      "prompt-translate": "De gebruiker heeft een vertaling van de geselecteerde tekst aangevraagd. Vertaal alle {%t:{%s:sourceLocale%}%} naar {%t:{%s:targetLanguage%}%} en {%t:{%s:targetLanguage%}%} naar {%t:{%s:sourceLocale%}%}. Geef de gebruiker geen verdere instructies of uitleg. Schrijf altijd in platte tekst zonder opmaak, labels, kopjes of lijsten.",
      "prompt-translate-user": 'Vertaal de geselecteerde tekst in {%t:{%s:sourceLocale%}%}. De gebruiker heeft de volgende tekst geselecteerd: "{%s:selection.text%}".',
      "prompt-translate-context": 'Deze is geselecteerd uit de context: "{%s:selection.context%}". Let op vertaal niet de context, maar alleen de selectie.',
      "prompt-explain": "De gebruiker heeft een uitleg van de tekst aangevraagd. Ga diep in op alle details van de tekst en geef een duidelijke en beknopte uitleg. Geef aanvullende voorbeelden als dit past bij de uitleg. Schrijf altijd in platte tekst zonder opmaak, labels, kopjes of lijsten.",
      "prompt-explain-user": 'Leg de geselecteerde tekst uit in {%t:{%s:sourceLocale%}%}. De gebruiker heeft de volgende tekst geselecteerd: "{%s:selection.text%}".',
      "prompt-explain-context": 'Deze is geselecteerd uit de context: "{%s:selection.context%}". Let op leg niet niet de context uit, maar alleen de selectie.',
      greeting: "Hoi!",
      "credits-link": "Gemaakt door {%name%}",
      "button-answer": "Antwoorden",
      "button-ask": "Vragen",
      "button-close": "Sluiten",
      "button-generate": "Genereren",
      "button-go_back": "Ga terug",
      "button-reload": "Herladen",
      "button-reply": "Antwoorden",
      "button-reset": "Resetten",
      "button-rewrite": "Herschrijven",
      "context-translate": "Vertaal selectie",
      "context-explain": "Leg selectie uit",
      "context-copy": "Kopieer selectie",
      select_an_option: "Selecteer een optie",
      "api_model-temperature_none": "Geen",
      "api_model-temperature_low": "Laag",
      "api_model-temperature_medium": "Gemiddeld",
      "api_model-temperature_high": "Hoog",
      "banner-update_now": "Er is een update beschikbaar, klik hier om te updaten!",
      "popup-explain": "Leg de text hieronder uit:",
      "popup-translate": "Vertaal de text hieronder:",
      "setup-source_language": "Dus jij wilt een taal beter beheersen? Laat deze app je helpen met oefenen. We moeten beginnen met een taal te kiezen die je al kent.",
      "setup-target_language": "Nu het volgende probleem, welke taal wil je leren?",
      "setup-proficiency_level": "Hoe goed zou jij zeggen dat je al in de taal bent? Zie de uitleg hieronder samen met een voorbeeld tekst om een idee te geven wat voor teksten je kan verwachten.",
      "setup-topics_of_interest": "Het is natuurlijk veel leuker als er af en toe een onderwerp voorbij komt wat je interessant vind. Vul daarom hieronder een aantal onderwerpen in die regelmatig terug kunnen komen. Denk hierbij vooral aan enige hobbies of andere interesses. Des te meer des te beter!",
      "setup-api_provider": 'Om te oefenen wordt gebruik gemaakt van een "Large Language Model". Je hebt er vast wel van gehoord, iedereen in de technologie sector houdt maar niet op over de ontwikkelingen in kunstmatige intelligentie. De app maakt dus gebruik van een LLM om de oefening te maken en te beoordelen. Helaas komt de app niet zelf met een eentje, dus moeten we een koppeling maken met een LLM. Met welke aanbieder wil je een koppeling maken?',
      "setup-api_credentials": "Nu is de grote vraag nog de sleutel. Deze kun je bij het ontwikkelaars paneel. Er staat waarschijnlijk al bij vermeld dat je deze niet met derden moet delen. Gelukkig stuurt deze app nooit de sleutel door. Vertrouw je het toch niet? Bekijk dan de brondcode van deze app, of wacht wellicht tot er een variant gemaakt is waarbij dat niet meer nodig is.",
      "setup-test_api_credentials": "Sleutel testen",
      "setup-api_credentials_untested": "Test de gegevens eerst voordat je verder gaat.",
      "setup-api_credentials_tested": 'De opgegeven sleutel werkt, nu kan je nog kiezen uit welke "Large Language Model" je wilt gebruiken. Heb je geen idee wat de verschillen zijn? Geen probleem, we raden aan dat je "{%preferredModel%}" selecteert, daarmee komt het vast wel goed.',
      "setup-outro": "Heel veel succes en plezier!",
      "setup-next": "Begin met oefenen",
      "overview-current_profile": "Met welk profiel wil je oefenen?",
      "overview-intro": "Wat wil je gaan doen?",
      "overview-clarification-description": "Krijg verduidelijk over het {%t:{%s:targetLanguage%}%}, bijvoorbeeld een grammatica regel zoals vervoegingen en naamvallen.",
      "overview-clarification-title": "Vraag om uitleg",
      "overview-comprehension-description": "Je krijgt een korte tekst samen met een vraag die je kan beantwoorden.",
      "overview-comprehension-title": "Beantwoord vragen",
      "overview-conversation-description": "Er zal een kort gesprekje gespeeld worden over bijvoorbeeld het bestellen van eten of over een hobby.",
      "overview-conversation-title": "Oefen gesprekken",
      "overview-migrate-description": "Exporteer, importeer of reset uw gegevens.",
      "overview-migrate-title": "Gegevens beheren",
      "overview-options-description": "Pas aan welke taal je wilt leren, welke onderwerpen je interessant vind of welke LLM gebruikt wordt.",
      "overview-options-title": "Pas instellingen aan",
      "overview-reading-description": "Je kunt een tekst genereren waarbij elke alinea in beide talen beschikbaar is.",
      "overview-reading-title": "Lees teksten",
      "overview-rewrite-description": "Je kunt de LLM een tekst laten herschrijven in {%t:{%s:targetLanguage%}%} op jouw vaardigheidsniveau.",
      "overview-rewrite-title": "Teksten herschrijven",
      "overview-story-description": "Je gaat omste beurten stukje voor stukje een verhaal schrijven.",
      "overview-story-title": "Schrijf een verhaal",
      "overview-vocabulary-description": "Je krijgt een woord samen met de definitie ervan vervolgens schrijf je een zin dat dit woord gebruikt.",
      "overview-vocabulary-title": "Leer woorden",
      "options-source_language": "Welke taal ken je al?",
      "options-profile_management": "Hieronder zie je een lijst aan profielen. Met de bewerk en verwijder knoppen kun je deze beheren.",
      "options-select_profile": "Met welke profiel wil je oefenen?",
      "options-profile_delete": "Verwijder",
      "options-profile_update": "Bewerk",
      "options-profile_add": "Nieuw profiel toevoegen",
      "options-api_provider": 'Om te oefenen wordt gebruik gemaakt van een "Large Language Model" om de oefening te maken en te beoordelen. Met welke aanbieder wil je een koppeling maken?',
      "options-api_credentials": "Voer de sleutel uit het ontwikkelaars paneel in.",
      "options-test_api_credentials": "Sleutel testen",
      "options-api_credentials_untested": "Test de gegevens eerst voordat je verder gaat.",
      "options-api_credentials_tested": 'De opgegeven sleutel werkt. Kies een "Large Language Model" dat je wilt gebruiken, wij raden "{%preferredModel%}" aan.',
      "options-api_model_advanced_settings": "Geadvanceerde model instellingen",
      "options-api_model_temperature-select": "Wat moet de variabiliteit zijn? Door de variabiliteit te verhogen, vergroot je de creativiteit en variatie in de gegenereerde teksten, maar als deze te hoog staat kan het resulteren in onzin. De standaardwaarde is 0.5.",
      "profile-target_language": "Welke taal wil je leren?",
      "profile-proficiency_level": "Hoe vaardig ben je al in de taal? Zie de uitleg hieronder samen met een voorbeeld tekst om een idee te geven wat voor teksten je kan verwachten.",
      "profile-topics_of_interest": "Vul hieronder een aantal onderwerpen in die regelmatig terug kunnen komen in de oefening.",
      "migrate-export": "Exporteer de gegevens die de app heeft opgeslagen. Het is belangrijk op te merken dat de export niet de API-sleutel bevat die wordt gebruikt om toegang te krijgen tot een LLM-provider. Bij het importeren van gegevens moet deze opnieuw worden toegepast.",
      "migrate-export_button": "Download uw gegevens",
      "migrate-import": "Importeer eerder geëxporteerde gegevens. Eenmaal geïmporteerd, kan het niet ongedaan worden gemaakt, dus wees voorzichtig! Het wordt aanbevolen om uw bestaande gegevens te exporteren voordat u ze overschrijft met een nieuwe import. Na een succesvolle import wordt u teruggebracht naar het instellingenscherm met de toegepaste import.",
      "migrate-import_button": "Upload uw gegevens",
      "migrate-reset": "Verwijder alle gegevens en reset de app. Eenmaal uitgevoerd kan deze actie niet ongedaan worden gemaakt.",
      "migrate-reset_button": "Reset",
      "migrate-reset_button-confirmation": "Ik bevestig dat ik absoluut zeker ben dat ik wil resetten!",
      "statistics-activity_per_category": " Je hebt al {%s:statisticReadingActivity%} teksten gelezen, {%s:statisticRewriteActivity%} teksten laten herschrijven, {%s:statisticComprehensionActivity%} vragen beantwoord, {%s:statisticVocabularyActivity%} woorden geoefened, {%s:statisticTypingActivity%} teksten getypt, {%s:statisticConversationActivity%} berichten verstuurd, {%s:statisticStoryActivity%} verhalen verteld en {%s:statisticClarificationActivity%} vragen gesteld.",
      "statistics-no_activity": "Je hebt helaas nog niet genoeg activiteiten gedaan om hier weer te geven. Ga naar het overzicht en kies een oefening om te beginnen, op de achtergrond zal bijgehouden worden hoeveel je er al voltooid hebt.",
      "statistics-no_activity_streak": "Op dit moment heb je geen lopende activiteitenreeks opgebouwd. Deze krijg je door op meerdere dagen op een rij minimaal één oefening te doen.",
      "statistics-current_activity_streak": "Op dit moment is jouw activiteitenreeks {%s:statisticCurrentActivityStreak%} dagen lang. Verlies het niet en zorg ervoor dat je voor middernacht oefend!",
      "statistics-extended_activity_streak": "Goed gedaan, je hebt jouw reeks voor vandaag verlengt! Op dit moment is jouw activiteitenreeks {%s:statisticCurrentActivityStreak%} dagen lang.",
      "statistics-longest_activity_streak": " Jouw langste activiteitenreeks ooit was {%s:statisticLongestActivityStreak%} dagen lang.",
      "clarification-intro": "Waar wil je meer over weten?",
      "clarification-placeholder": "Ik vraag mij af...",
      "comprehension-intro": "Je leest straks een tekst in het {%t:{%s:targetLanguage%}%} samen met een vraag erover, beantwoord de vraag in het {%t:{%s:targetLanguage%}%}. Vervolgens zal je enige verbeterpunten krijgen over jouw antwoord.",
      "conversation-intro": "Je gaat straks een gesprek simuleren in het {%t:{%s:targetLanguage%}%} zorg daarom dat je ook altijd in het {%t:{%s:targetLanguage%}%} antwoord. Tussendoor zal je enige verbeterpunten kunnen ontvangen.",
      "reading-intro": "Je zult een tekst lezen waarbij elke alinea zowel in {%t:{%s:targetLanguage%}%} als in {%t:{%s:sourceLanguage%}%} is geschreven, waardoor je je leesvaardigheid kunt oefenen. Je kunt optioneel een onderwerp opgeven waar de tekst over moet gaan.",
      "reading-placeholder": "Ik wil lezen over...",
      "rewrite-intro": "Je kunt hieronder een tekst invoeren. De LLM zorgt ervoor dat de tekst in {%t:{%s:sourceLanguage%}%} is op jouw geselecteerde vaardigheidsniveau.",
      "rewrite-placeholder": "Ik wil laten herschrijven...",
      "story-intro": "Je gaat straks een verhaal schrijven in het {%t:{%s:targetLanguage%}%} waarbij je omste beurten een stuk toevoegd. Maak je geen zorgen of het verhaal een goed, logisch en gegrond verhaal is, maar zorg vooral dat je de taal oefened. Zorg daarom dat je ook altijd in het {%t:{%s:targetLanguage%}%} antwoord. Tussendoor zal je enige verbeterpunten kunnen ontvangen.",
      "vocabulary-intro": "Je leest straks een woord samen met de definitie ervan in het {%t:{%s:targetLanguage%}%}. Antwoord met een zin waar het woord ingebruikt wordt in het {%t:{%s:targetLanguage%}%}. Vervolgens zal je enige verbeterpunten krijgen over jouw antwoord.",
      "typing-intro": "Je gaat straks een tekst overtypen in het {%t:{%s:targetLanguage%}%}. De cursor gaat verder als je elk teken correct typt. Je kunt hieronder een onderwerp opgeven waar je wilt dat de tekst over gaat samen met hoe lang de tekst moet zijn.",
      "typing-placeholder": "Ik wil typen over...",
      "typing-completed": "Oefening voltooid!",
      "typing-results-summary": "De tekst bestaat uit {%words%} woorden en {%characters%} letters. Je hebt de tekst getypt in {%minutes%} minuten en {%seconds%} seconden dit betekend dat je gemiddeld {%wpm%} woorden per minuut hebt getypt. Je hebt {%mistakes%} fouten gemaakt en hebt daarmee een nauwkeurigheid van {%accuracy%}%.",
      "typing-restart": "Herstarten",
      "typing-length_select": "Tekstlengte",
      "typing-length_short": "Kort (≈50 woorden)",
      "typing-length_medium": "Medium (≈100 woorden)",
      "typing-length_long": "Lang (≈200 woorden)",
      "typing-length_extra_long": "Extra lang (≈400 woorden)",
      "overview-typing-title": "Oefen typen",
      "overview-typing-description": "Verbeter je typingsnelheid en nauwkeurigheid in het {%t:{%s:targetLanguage%}%}."
    }
  });
  var TRANSLATABLE_CODES = Object.keys(TRANSLATIONS);

  // src/toaln/screens/sections/context-menu.js
  var removeContextMenu = (event, state) => {
    event.preventDefault();
    state.contextMenu = null;
    state.selection = null;
  };
  var handleBack = (event, state) => {
    window.history.back();
    removeContextMenu(event, state);
  };
  var handleCopy = (event, state) => {
    navigator.clipboard.writeText(state.selection.text);
    removeContextMenu(event, state);
  };
  var handleExplain = (event, state) => {
    state.popupModal = {
      messages: [{
        role: "user",
        content: translate(state, "popup-explain") + `\r
\r
` + state.selection.text
      }],
      pending: true
    };
    createMessage6(state, [{
      role: "user",
      content: translate(state, "prompt-explain-user")
    }, ...state.selection.text === state.selection.context ? [] : [{
      role: "context",
      content: translate(state, "prompt-explain-context")
    }]], translate(state, "prompt-context"), translate(state, "prompt-explain")).then(([error, _response, result]) => {
      state.popupModal.pending = false;
      if (error) {
        state.popupModal.error = error.toString();
        return;
      }
      state.popupModal.messages.push(result);
    });
    removeContextMenu(event, state);
  };
  var handleReload = (event, state) => {
    window.location.reload();
    removeContextMenu(event, state);
  };
  var handleTranslate = (event, state) => {
    state.popupModal = {
      messages: [{
        role: "user",
        content: translate(state, "popup-translate") + `\r
\r
` + state.selection.text
      }],
      pending: true
    };
    createMessage6(state, [{
      role: "user",
      content: translate(state, "prompt-translate-user")
    }, ...state.selection.text === state.selection.context ? [] : [{
      role: "context",
      content: translate(state, "prompt-translate-context")
    }]], translate(state, "prompt-context"), translate(state, "prompt-translate")).then(([error, _response, result]) => {
      state.popupModal.pending = false;
      if (error) {
        state.popupModal.error = error.toString();
        return;
      }
      state.popupModal.messages.push(result);
    });
    removeContextMenu(event, state);
  };
  var contextMenu = (state) => conditional(state.contextMenu && state.selection, () => {
    let top = state.contextMenu.pointerY <= window.innerHeight / 2;
    let left = state.contextMenu.pointerX <= window.innerWidth / 2;
    let anchor = (top ? "Top" : "Bottom") + (left ? "Left" : "Right");
    return node("div", {
      class: "context-menu",
      style: {
        ["border" + anchor + "Radius"]: "0",
        ...left ? {
          left: state.contextMenu.pointerX + "px"
        } : {
          right: window.innerWidth - state.contextMenu.pointerX + "px"
        },
        ...top ? {
          top: state.contextMenu.pointerY + "px"
        } : {
          bottom: window.innerHeight - state.contextMenu.pointerY + "px"
        }
      }
    }, [
      ...conditional(state.selection.text.length > 0, [
        node("button", {
          click: handleCopy
        }, translate(state, "context-copy")),
        node("button", {
          click: handleTranslate
        }, translate(state, "context-translate")),
        node("button", {
          click: handleExplain
        }, translate(state, "context-explain")),
        node("div", {
          class: "margin"
        })
      ]),
      node("button", {
        disabled: !window.history.length,
        click: handleBack
      }, translate(state, "button-go_back")),
      node("button", {
        click: handleReload
      }, translate(state, "button-reload"))
    ]);
  });

  // src/toaln/screens/sections/popup-modal.js
  var handleBack2 = (_event, state) => {
    state.popupModal = null;
  };
  var popupModal = (state) => conditional(state.popupModal, () => node("div", {
    class: "popup-modal"
  }, [
    ...conditional(state.popupModal.messages && state.popupModal.messages.length > 0, node("div", {
      class: "messages"
    }, state.popupModal.messages.map((message) => node("p", {
      class: "message-" + message?.role
    }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))))),
    ...conditional(state.popupModal.error, node("p", state.popupModal.error)),
    ...conditional(state.popupModal.pending, node("p", {
      class: "pending"
    })),
    node("button", {
      type: "button",
      click: handleBack2
    }, translate(state, "button-close"))
  ]));

  // src/toaln/screens/sections/update-banner.js
  var handleClick = () => {
    window.location.reload();
  };
  var updateBanner = (state) => conditional(state.appUpdateAvailable, () => [
    node("button", {
      click: handleClick
    }, translate(state, "banner-update_now")),
    node("div", {
      class: "margin"
    })
  ]);

  // src/toaln/utilities/screen.js
  var screenOptions = Object.values(SCREENS);
  var setScreen = (state, screen) => {
    if (screen && state.screen !== screen && screenOptions.includes(screen)) {
      if (screen === SCREENS.overview && state.profiles.length === 0) {
        return;
      }
      if (screen === SCREENS.profile && !state.activeProfileId) {
        return;
      }
      if (state.screen !== SCREENS.setup) {
        window.history.pushState({
          screen
        }, "", "?screen=" + screen);
      }
      state.screen = screen;
    }
  };
  var handleHistory = (state) => {
    window.addEventListener("popstate", (event) => {
      const screen = event.state && event.state.screen;
      if (screen === SCREENS.setup) {
        return false;
      }
      if (screen && state.screen !== screen && screenOptions.includes(screen)) {
        state.screen = screen;
      }
    });
  };

  // src/toaln/screens/migrate.js
  var EXCLUDED_KEYS = [
    "screen",
    "appUpdateAvailable",
    "migrateImportError",
    "apiCredentials",
    "apiCredentialsError",
    "apiCredentialsPending",
    "apiCredentialsTested"
  ];
  var handleExport = (_event, state) => {
    const filtered = {};
    for (const key in state) {
      if (!EXCLUDED_KEYS.includes(key)) {
        filtered[key] = state[key];
      }
    }
    const data = JSON.stringify(filtered);
    const blob = new Blob([data], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "toaln_export-" + new Date().toISOString() + ".json";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };
  var handleImport = (_event, state) => {
    const input = document.createElement("input");
    input.setAttribute("accept", "application/json");
    input.setAttribute("hidden", true);
    input.setAttribute("type", "file");
    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader;
        reader.addEventListener("error", () => {
          state.migrateImportError = "Error reading file.";
        });
        reader.addEventListener("load", () => {
          try {
            const imported = JSON.parse(reader.result);
            for (const key of EXCLUDED_KEYS) {
              delete imported[key];
            }
            Object.assign(state, imported);
            for (const key of EXCLUDED_KEYS) {
              delete state[key];
            }
          } catch (error) {
            state.migrateImportError = error.toString();
          }
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          window.location.reload();
        });
        reader.readAsText(file);
      }
      input.remove();
      setScreen(state, SCREENS.setup);
    });
    document.body.appendChild(input);
    input.click();
  };
  var handleReset = (_event, state) => {
    if (!state.migrateReset) {
      state.migrateReset = true;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, null);
    window.location.reload();
  };
  var handleBack3 = (_event, state) => {
    state.migrateReset = false;
    setScreen(state, SCREENS.overview);
  };
  var migrate = (state) => [
    node("b", translate(state, "greeting")),
    node("p", translate(state, "migrate-export")),
    node("button", {
      click: handleExport,
      type: "button"
    }, translate(state, "migrate-export_button")),
    node("p", translate(state, "migrate-import")),
    node("button", {
      click: handleImport,
      type: "button"
    }, translate(state, "migrate-import_button")),
    ...conditional(state.migrateImportError, node("p", {}, state.migrateImportError)),
    node("p", translate(state, "migrate-reset")),
    node("button", {
      click: handleReset,
      type: "button"
    }, conditional(state.migrateReset, translate(state, "migrate-reset_button-confirmation"), translate(state, "migrate-reset_button"))),
    node("button", {
      click: handleBack3,
      type: "button"
    }, translate(state, "button-go_back"))
  ];

  // src/shared/utilities/identifiers.js
  var IDENTIFIER_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var createIdentifier2 = (length = 32) => {
    let result = "";
    const charactersLength = IDENTIFIER_CHARACTERS.length;
    let counter = 0;
    while (counter < length) {
      result += IDENTIFIER_CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  };

  // src/toaln/utilities/parameters.js
  var convertTemperature = (state) => {
    const suffix = " (" + (state.apiModelTemperature ?? 0).toString() + ")";
    if (state.apiModelTemperature <= 0) {
      return translate(state, "api_model-temperature_none") + suffix;
    } else if (state.apiModelTemperature <= 1 / 3) {
      return translate(state, "api_model-temperature_low") + suffix;
    } else if (state.apiModelTemperature === 0.5) {
      return translate(state, "api_model-temperature_medium") + suffix;
    } else if (state.apiModelTemperature <= 2 / 3) {
      return translate(state, "api_model-temperature_medium") + suffix;
    }
    return translate(state, "api_model-temperature_high") + suffix;
  };

  // src/toaln/screens/options.js
  var isReady2 = (state) => {
    return isReady(state) && state.profiles.length > 0 && state.activeProfileId;
  };
  var handleSourceLanguage = (event, state) => {
    if (state.sourceLocale !== event.target.selectedOptions[0].value) {
      state.sourceLocale = event.target.selectedOptions[0].value;
      state.sourceLanguage = getLanguageFromLocale(state.sourceLocale);
      setLangAttribute(state);
    }
  };
  var handleUpdateProfile = (event, state) => {
    const profileId = event.target.getAttribute("data-profile-id");
    state.activeProfileId = profileId;
    setScreen(state, SCREENS.profile);
  };
  var handleDeleteProfile = (event, state) => {
    if (state.profiles.length > 1) {
      const profileId = event.target.getAttribute("data-profile-id");
      const index = state.profiles.findIndex((p) => p.id === profileId);
      if (index !== -1) {
        state.profiles.splice(index, 1);
        if (state.activeProfileId === profileId) {
          state.activeProfileId = state.profiles[0].id;
        }
      }
    }
  };
  var handleSwitchProfile = (event, state) => {
    if (state.activeProfileId !== event.target.selectedOptions[0].value) {
      state.activeProfileId = event.target.selectedOptions[0].value;
    }
  };
  var handleAddProfile = (_event, state) => {
    const newProfileId = createIdentifier2();
    const newProfile = cloneRecursive4(PROFILE_TEMPLATE);
    newProfile.id = newProfileId;
    state.profiles.push(newProfile);
    state.activeProfileId = newProfileId;
    setScreen(state, SCREENS.profile);
  };
  var handleApiProvider = (event, state) => {
    if (state.apiProvider !== event.target.selectedOptions[0].value) {
      state.apiProvider = event.target.selectedOptions[0].value;
      state.apiCredentialsTested = false;
      state.apiModels = null;
    }
  };
  var handleApiCredentials = (event, state) => {
    if (state.apiCredentials !== event.target.value) {
      state.apiCredentials = event.target.value;
    }
  };
  var handleApiCredentialsTest = (_event, state) => {
    state.apiCredentialsPending = true;
    getModels6(state).then(([error, _response, result]) => {
      state.apiCredentialsPending = false;
      if (error) {
        state.apiCredentialsTested = false;
        state.apiCredentialsError = error.toString();
        state.apiModels = null;
      } else {
        state.apiCredentialsTested = true;
        state.apiCredentialsError = false;
        state.apiModels = result;
      }
    });
  };
  var handleApiModel = (event, state) => {
    if (state.apiModel !== event.target.selectedOptions[0].value) {
      state.apiModel = event.target.selectedOptions[0].value;
    }
  };
  var handleApiModelTemperature = (event, state) => {
    if (state.apiModelTemperature !== event.target.value) {
      state.apiModelTemperature = Number.parseFloat(event.target.value);
    }
  };
  var handleGoBack = (_event, state) => {
    if (isReady2(state)) {
      setScreen(state, SCREENS.overview);
    }
  };
  var options = (state) => [
    node("b", translate(state, "greeting")),
    node("label", {
      for: "select_source_language"
    }, translate(state, "options-source_language")),
    node("select", {
      id: "select_source_language",
      change: handleSourceLanguage
    }, TRANSLATABLE_CODES.map((localeCode) => node("option", {
      selected: state.sourceLocale === localeCode ? "selected" : false,
      value: localeCode
    }, translate(state, localeCode, localeCode)))),
    node("p", translate(state, "options-profile_management")),
    ...conditional(state.profiles.length > 0, [
      ...state.profiles.map((profile) => node("div", {
        class: "profile-item"
      }, [
        node("span", generateProfileName(state, profile, 60)),
        node("button", {
          "data-profile-id": profile.id,
          click: handleUpdateProfile,
          type: "button"
        }, translate(state, "options-profile_update")),
        ...conditional(state.profiles.length > 1, node("button", {
          "data-profile-id": profile.id,
          click: handleDeleteProfile,
          type: "button"
        }, translate(state, "options-profile_delete")))
      ]))
    ]),
    node("button", {
      click: handleAddProfile,
      type: "button"
    }, translate(state, "options-profile_add")),
    ...conditional(state.profiles.length > 1, [
      node("label", translate(state, "options-select_profile")),
      node("select", {
        change: (event) => handleSwitchProfile(event, state, event.target.value)
      }, state.profiles.map((profile) => node("option", {
        selected: state.activeProfileId === profile.id ? "selected" : false,
        value: profile.id
      }, generateProfileName(state, profile, 60))))
    ]),
    node("label", {
      for: "select_api_provider"
    }, translate(state, "options-api_provider")),
    node("select", {
      id: "select_api_provider",
      change: handleApiProvider
    }, Object.keys(APIS).map((apiProvider) => node("option", {
      selected: state.apiProvider === apiProvider ? "selected" : false,
      value: apiProvider
    }, APIS[apiProvider].name))),
    ...conditional(APIS[state.apiProvider]?.requireCredentials, [
      node("label", {
        for: "input-api_credentials"
      }, translate(state, "options-api_credentials")),
      node("input", {
        id: "input-api_credentials",
        keyup: handleApiCredentials,
        type: "password",
        value: state.apiCredentials
      })
    ]),
    node("button", {
      click: handleApiCredentialsTest,
      type: "button"
    }, [
      translate(state, "options-test_api_credentials"),
      node("span", {
        class: state.apiCredentialsPending ? "pending" : ""
      })
    ]),
    ...conditional(state.apiCredentialsError, [node("p", state.apiCredentialsError)]),
    ...conditional(!state.apiCredentialsTested, [node("p", translate(state, "options-api_credentials_untested"))], [
      node("label", {
        for: "select_api_model"
      }, translate(state, "options-api_credentials_tested").replace("{%preferredModel%}", APIS[state.apiProvider]?.preferredModelName ?? APIS[state.apiProvider]?.preferredModel)),
      node("select", {
        id: "select_api_model",
        change: handleApiModel
      }, [
        node("option", {
          disabled: true,
          selected: !isReady(state) ? "selected" : false,
          value: null
        }, translate(state, "select_an_option")),
        ...state.apiModels?.data?.filter(APIS[state.apiProvider].modelOptionsFilter ?? (() => true))?.sort((a, b) => a.id.localeCompare(b.id))?.map((model) => node("option", {
          selected: (state.apiModel ?? APIS[state.apiProvider].preferredModel) === model.id ? "selected" : false,
          value: model.id
        }, model.name ?? model.id)) ?? []
      ]),
      ...conditional(isReady(state), [
        node("details", [
          node("summary", translate(state, "options-api_model_advanced_settings")),
          node("label", {
            for: "input-api_model_temperature"
          }, translate(state, "options-api_model_temperature-select")),
          node("input", {
            id: "input-api_model_temperature",
            input: handleApiModelTemperature,
            type: "range",
            min: 0,
            max: 1,
            step: 0.01,
            value: state.apiModelTemperature
          }),
          node("span", {
            role: "note"
          }, convertTemperature(state))
        ])
      ])
    ]),
    node("button", {
      click: handleGoBack,
      disabled: !isReady2(state),
      type: "button"
    }, translate(state, "button-go_back"))
  ];

  // src/toaln/screens/overview.js
  var handleSwitchProfile2 = (event, state) => {
    state.activeProfileId = event.target.value;
  };
  var handleClarification = (_event, state) => {
    setScreen(state, SCREENS.clarification);
  };
  var handleComprehension = (_event, state) => {
    setScreen(state, SCREENS.comprehension);
  };
  var handleConversation = (_event, state) => {
    setScreen(state, SCREENS.conversation);
  };
  var handleReading = (_event, state) => {
    setScreen(state, SCREENS.reading);
  };
  var handleRewrite = (_event, state) => {
    setScreen(state, SCREENS.rewrite);
  };
  var handleStory = (_event, state) => {
    setScreen(state, SCREENS.story);
  };
  var handleTyping = (_event, state) => {
    setScreen(state, SCREENS.typing);
  };
  var handleVocabulary = (_event, state) => {
    setScreen(state, SCREENS.vocabulary);
  };
  var handleOptions = (_event, state) => {
    setScreen(state, SCREENS.options);
  };
  var handleMigrate = (_event, state) => {
    setScreen(state, SCREENS.migrate);
  };
  var overview = (state) => [
    node("p", [
      node("b", translate(state, "greeting")),
      node("br"),
      ...conditional(state.statisticLastActivityOn, translate(state, "statistics-activity_per_category"), translate(state, "statistics-no_activity"))
    ]),
    node("p", [
      ...conditional(state.statisticCurrentActivityStreak > 1 && (new Date(state.statisticLastActivityOn).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10) || new Date(state.statisticLastActivityOn).toISOString().slice(0, 10) === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)), [
        ...conditional(new Date(state.statisticLastActivityOn).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10), translate(state, "statistics-extended_activity_streak"), translate(state, "statistics-current_activity_streak")),
        ...conditional(state.statisticLongestActivityStreak > state.statisticCurrentActivityStreak, " " + translate(state, "statistics-longest_activity_streak"))
      ], [
        translate(state, "statistics-no_activity_streak"),
        ...conditional(state.statisticLongestActivityStreak > 1, " " + translate(state, "statistics-longest_activity_streak"))
      ]),
      " " + translate(state, "overview-intro")
    ]),
    ...conditional(state.profiles.length > 1, [
      node("p"),
      node("label", {
        for: "overview-select_profile"
      }, translate(state, "overview-current_profile")),
      node("select", {
        id: "overview-select_profile",
        change: handleSwitchProfile2
      }, state.profiles.map((profile) => node("option", {
        selected: state.activeProfileId === profile.id ? "selected" : false,
        value: profile.id
      }, generateProfileName(state, profile, 60))))
    ]),
    node("p", translate(state, "overview-intro")),
    node("div", {
      class: "vertical-layout"
    }, [
      node("button", {
        class: "card",
        click: handleReading,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83D\uDCD6"),
        node("b", translate(state, "overview-reading-title")),
        node("br"),
        translate(state, "overview-reading-description")
      ]),
      node("button", {
        class: "card",
        click: handleRewrite,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83E\uDD16"),
        node("b", translate(state, "overview-rewrite-title")),
        node("br"),
        translate(state, "overview-rewrite-description")
      ]),
      node("button", {
        class: "card",
        click: handleTyping,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "⌨️"),
        node("b", translate(state, "overview-typing-title")),
        node("br"),
        translate(state, "overview-typing-description")
      ]),
      node("button", {
        class: "card",
        click: handleVocabulary,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83D\uDD0E"),
        node("b", translate(state, "overview-vocabulary-title")),
        node("br"),
        translate(state, "overview-vocabulary-description")
      ]),
      node("button", {
        class: "card",
        click: handleComprehension,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83D\uDD8A️"),
        node("b", translate(state, "overview-comprehension-title")),
        node("br"),
        translate(state, "overview-comprehension-description")
      ]),
      node("button", {
        class: "card",
        click: handleConversation,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83D\uDCAC"),
        node("b", translate(state, "overview-conversation-title")),
        node("br"),
        translate(state, "overview-conversation-description")
      ]),
      node("button", {
        class: "card",
        click: handleStory,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83C\uDFAD"),
        node("b", translate(state, "overview-story-title")),
        node("br"),
        translate(state, "overview-story-description")
      ]),
      node("button", {
        class: "card",
        click: handleClarification,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83D\uDE4B"),
        node("b", translate(state, "overview-clarification-title")),
        node("br"),
        translate(state, "overview-clarification-description")
      ]),
      node("div", {
        class: "margin"
      }),
      node("button", {
        class: "card",
        click: handleOptions,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "⚙️"),
        node("b", translate(state, "overview-options-title")),
        node("br"),
        translate(state, "overview-options-description")
      ]),
      node("button", {
        class: "card",
        click: handleMigrate,
        type: "button"
      }, [
        node("span", {
          class: "icon"
        }, "\uD83D\uDCBE"),
        node("b", translate(state, "overview-migrate-title")),
        node("br"),
        translate(state, "overview-migrate-description")
      ])
    ]),
    node("p", {
      class: "text-right"
    }, node("a", {
      href: "https://rondekker.com/",
      target: "_blank",
      rel: "noopener me"
    }, translate(state, "credits-link").replace("{%name%}", "Ron Dekker")))
  ];

  // src/toaln/screens/profile.js
  var handleTargetLanguage = (event, state) => {
    const profile = getActiveProfile(state);
    if (profile) {
      profile.targetLanguage = event.target.selectedOptions[0].value;
    }
  };
  var handleProficiencyLevel = (event, state) => {
    const profile = getActiveProfile(state);
    if (profile) {
      profile.proficiencyLevel = event.target.selectedOptions[0].value;
    }
  };
  var handleNewTopic = (event, state) => {
    const profile = getActiveProfile(state);
    if (profile && event.target.value) {
      profile.topicsOfInterest.push(event.target.value);
    }
  };
  var handleUpdateTopic = (event, state) => {
    const index = Number.parseInt(event.target.getAttribute("data-index"));
    const currentProfile = getActiveProfile(state);
    if (!event.target.value) {
      currentProfile.topicsOfInterest.splice(index, 1);
    } else {
      currentProfile.topicsOfInterest[index] = event.target.value;
    }
  };
  var handleGoBack2 = (_event, state) => {
    setScreen(state, SCREENS.options);
  };
  var profile = (state) => {
    const currentProfile = getActiveProfile(state);
    return [
      node("b", translate(state, "greeting")),
      node("label", {
        for: "select_target_language"
      }, translate(state, "profile-target_language")),
      node("select", {
        id: "select_target_language",
        change: handleTargetLanguage
      }, LOCALE_CODES.map((localeCode) => node("option", {
        selected: currentProfile?.targetLanguage === localeCode ? "selected" : false,
        value: localeCode
      }, translate(state, localeCode)))),
      node("label", {
        for: "select_proficiency_level"
      }, translate(state, "profile-proficiency_level")),
      node("select", {
        id: "select_proficiency_level",
        change: handleProficiencyLevel
      }, PROFICIENCY_LEVEL_CODES.map((proficiencyLevel) => node("option", {
        selected: currentProfile?.proficiencyLevel === proficiencyLevel ? "selected" : false,
        value: proficiencyLevel
      }, translate(state, "proficiency_name-" + proficiencyLevel)))),
      node("ul", translate(state, "proficiency_description-" + currentProfile?.proficiencyLevel).map((text) => node("li", text))),
      node("label", {
        for: "input_topics_of_interest"
      }, translate(state, "profile-topics_of_interest")),
      ...currentProfile?.topicsOfInterest?.map((topic, index) => node("input", {
        "data-index": String(index),
        keyup: handleUpdateTopic,
        value: topic
      })),
      node("input", {
        keyup: handleNewTopic,
        id: "input_topics_of_interest"
      }),
      node("button", {
        click: handleGoBack2,
        type: "button"
      }, translate(state, "button-go_back"))
    ];
  };

  // src/toaln/screens/setup.js
  var ensureProfileExists = (state) => {
    if (state.profiles.length === 0) {
      const newProfileId = createIdentifier2();
      const newProfile = cloneRecursive4(PROFILE_TEMPLATE);
      newProfile.id = newProfileId;
      state.profiles.push(newProfile);
      state.activeProfileId = newProfileId;
    }
  };
  var isReady3 = (state) => {
    return isReady(state) && state.profiles.length > 0 && state.activeProfileId;
  };
  var handleSourceLanguage2 = (event, state) => {
    if (state.sourceLocale !== event.target.selectedOptions[0].value) {
      state.sourceLocale = event.target.selectedOptions[0].value;
      state.sourceLanguage = getLanguageFromLocale(state.sourceLocale);
      setLangAttribute(state);
    }
  };
  var handleTargetLanguage2 = (event, state) => {
    ensureProfileExists(state);
    const value = event.target.selectedOptions[0].value;
    if (!state.profiles[0].targetLanguage !== value) {
      state.profiles[0].targetLanguage = value;
    }
  };
  var handleProficiencyLevel2 = (event, state) => {
    ensureProfileExists(state);
    const value = event.target.selectedOptions[0].value;
    if (state.profiles[0].proficiencyLevel !== value) {
      state.profiles[0].proficiencyLevel = value;
    }
  };
  var handleNewTopic2 = (event, state) => {
    ensureProfileExists(state);
    if (event.target.value) {
      state.profiles[0].topicsOfInterest.push(event.target.value);
    }
  };
  var handleUpdateTopic2 = (event, state) => {
    ensureProfileExists(state);
    const index = Number.parseInt(event.target.getAttribute("data-index"));
    if (!event.target.value) {
      state.profiles[0].topicsOfInterest.splice(index, 1);
    } else {
      state.profiles[0].topicsOfInterest[index] = event.target.value;
    }
  };
  var handleApiProvider2 = (event, state) => {
    if (state.apiProvider !== event.target.selectedOptions[0].value) {
      state.apiProvider = event.target.selectedOptions[0].value;
      state.apiCredentialsTested = false;
      state.apiModels = null;
    }
  };
  var handleApiCredentials2 = (event, state) => {
    if (state.apiCredentials !== event.target.value) {
      state.apiCredentials = event.target.value;
    }
  };
  var handleApiCredentialsTest2 = (_event, state) => {
    state.apiCredentialsPending = true;
    getModels6(state).then(([error, _response, result]) => {
      state.apiCredentialsPending = false;
      if (error) {
        state.apiCredentialsTested = false;
        state.apiCredentialsError = error.toString();
        state.apiModels = null;
      } else {
        state.apiCredentialsTested = true;
        state.apiCredentialsError = false;
        state.apiModels = result;
        state.apiModel ??= result?.data.length > 0 ? result.data[0].id : null;
      }
    });
  };
  var handleApiModel2 = (event, state) => {
    if (state.apiModel !== event.target.selectedOptions[0].value) {
      state.apiModel = event.target.selectedOptions[0].value;
    }
  };
  var handleApiModelTemperature2 = (event, state) => {
    if (state.apiModelTemperature !== event.target.value) {
      state.apiModelTemperature = Number.parseFloat(event.target.value);
    }
  };
  var handleNext = (_event, state) => {
    if (isReady3(state)) {
      setScreen(state, SCREENS.overview);
    }
  };
  var setup = (state) => [
    node("b", translate(state, "greeting")),
    node("label", {
      for: "select_source_language"
    }, translate(state, "setup-source_language")),
    node("select", {
      id: "select_source_language",
      change: handleSourceLanguage2
    }, TRANSLATABLE_CODES.map((localeCode) => node("option", {
      selected: state.sourceLocale === localeCode ? "selected" : false,
      value: localeCode
    }, translate(state, localeCode, localeCode)))),
    node("label", {
      for: "select_target_language"
    }, translate(state, "setup-target_language")),
    node("select", {
      id: "select_target_language",
      change: handleTargetLanguage2
    }, LOCALE_CODES.map((localeCode) => node("option", {
      selected: (state.profiles[0]?.targetLanguage || "eng") === localeCode ? "selected" : false,
      value: localeCode
    }, translate(state, localeCode)))),
    node("label", {
      for: "select_proficiency_level"
    }, translate(state, "setup-proficiency_level")),
    node("select", {
      id: "select_proficiency_level",
      change: handleProficiencyLevel2
    }, PROFICIENCY_LEVEL_CODES.map((proficiencyLevel) => node("option", {
      selected: (state.profiles[0]?.proficiencyLevel || "a1") === proficiencyLevel ? "selected" : false,
      value: proficiencyLevel
    }, translate(state, "proficiency_name-" + proficiencyLevel)))),
    node("ul", translate(state, "proficiency_description-" + (state.profiles[0]?.proficiencyLevel || "a1")).map((text) => node("li", text))),
    node("blockquote", node("p", conditional(TRANSLATABLE_CODES.includes(state.profiles[0]?.targetLanguage || "eng"), translate(state, "proficiency_example-" + (state.profiles[0]?.proficiencyLevel || "a1"), state.profiles[0]?.targetLanguage), translate(state, "proficiency_example-" + (state.profiles[0]?.proficiencyLevel || "a1"))))),
    node("label", {
      for: "input_topics_of_interest"
    }, translate(state, "setup-topics_of_interest")),
    ...(state.profiles[0]?.topicsOfInterest || []).map((topic, index) => node("input", {
      "data-index": String(index),
      keyup: handleUpdateTopic2,
      value: topic
    })),
    node("input", {
      keyup: handleNewTopic2,
      id: "input_topics_of_interest"
    }),
    node("label", {
      for: "select_api_provider"
    }, translate(state, "setup-api_provider")),
    node("select", {
      id: "select_api_provider",
      change: handleApiProvider2
    }, Object.keys(APIS).map((apiProvider) => node("option", {
      selected: state.apiProvider === apiProvider ? "selected" : false,
      value: apiProvider
    }, APIS[apiProvider].name))),
    ...conditional(APIS[state.apiProvider]?.requireCredentials, [
      node("label", {
        for: "input-api_credentials"
      }, translate(state, "setup-api_credentials")),
      node("input", {
        id: "input-api_credentials",
        keyup: handleApiCredentials2,
        type: "password",
        value: state.apiCredentials
      })
    ]),
    node("button", {
      click: handleApiCredentialsTest2,
      type: "button"
    }, [
      translate(state, "setup-test_api_credentials"),
      node("span", {
        class: state.apiCredentialsPending ? "pending" : ""
      })
    ]),
    ...conditional(state.apiCredentialsError, [node("p", state.apiCredentialsError)]),
    ...conditional(!state.apiCredentialsTested, [node("p", translate(state, "setup-api_credentials_untested"))], [
      node("label", {
        for: "select_api_model"
      }, translate(state, "setup-api_credentials_tested").replace("{%preferredModel%}", APIS[state.apiProvider]?.preferredModelName ?? APIS[state.apiProvider]?.preferredModel)),
      node("select", {
        id: "select_api_model",
        change: handleApiModel2
      }, [
        node("option", {
          disabled: true,
          selected: !isReady(state) ? "selected" : false,
          value: null
        }, translate(state, "select_an_option")),
        ...state.apiModels?.data?.filter(APIS[state.apiProvider].modelOptionsFilter ?? (() => true))?.sort((a, b) => a.id.localeCompare(b.id))?.map((model) => node("option", {
          selected: (state.apiModel ?? APIS[state.apiProvider].preferredModel) === model.id ? "selected" : false,
          value: model.id
        }, model.name ?? model.id)) ?? []
      ]),
      ...conditional(isReady(state), [
        node("details", [
          node("summary", translate(state, "setup-api_model_advanced_settings")),
          node("label", {
            for: "input-api_model_temperature"
          }, translate(state, "setup-api_model_temperature-select")),
          node("input", {
            id: "input-api_model_temperature",
            input: handleApiModelTemperature2,
            type: "range",
            min: 0,
            max: 1,
            step: 0.01,
            value: state.apiModelTemperature
          }),
          node("span", {
            role: "note"
          }, convertTemperature(state))
        ])
      ])
    ]),
    ...conditional(isReady3(state), [node("p", translate(state, "setup-outro"))]),
    node("button", {
      click: handleNext,
      disabled: !isReady3(state),
      type: "button"
    }, translate(state, "setup-next"))
  ];

  // src/toaln/utilities/streak.js
  var ONE_HOUR = 60 * 60 * 1000;
  var ONE_DAY = ONE_HOUR * 24;
  var TWO_DAYS = ONE_DAY * 2;
  var GRACE_PERIOD = ONE_HOUR;
  var onActivity = (state) => {
    const lastActivityOn = new Date(state.statisticLastActivityOn);
    const lastActivityUTC = Date.UTC(lastActivityOn.getFullYear(), lastActivityOn.getMonth(), lastActivityOn.getDate());
    const today = new Date;
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const deltaTime = todayUTC - lastActivityUTC;
    if (deltaTime >= TWO_DAYS + GRACE_PERIOD) {
      state.statisticCurrentActivityStreak = 1;
      state.statisticLastActivityOn = today.toISOString();
    } else if (deltaTime >= ONE_DAY) {
      state.statisticCurrentActivityStreak++;
      state.statisticLastActivityOn = today.toISOString();
    }
    if (state.statisticCurrentActivityStreak > state.statisticLongestActivityStreak) {
      state.statisticLongestActivityStreak = state.statisticCurrentActivityStreak;
    }
  };

  // src/toaln/screens/exercises/clarification.js
  var handleAsk = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.clarificationPending && profile2.clarificationInput && profile2.clarificationInput.trim().length > 0) {
      profile2.clarificationError = false;
      profile2.clarificationPending = true;
      profile2.clarificationMessages.push({
        role: "user",
        content: profile2.clarificationInput.trim()
      });
      profile2.clarificationInput = "";
      createMessage6(state, profile2.clarificationMessages, translate(state, "prompt-context"), translate(state, "prompt-clarification")).then(([error, _response, result]) => {
        profile2.clarificationPending = false;
        if (error) {
          profile2.clarificationError = error.toString();
          const message = profile2.clarificationMessages.pop();
          profile2.clarificationInput = message.content;
          return;
        }
        profile2.clarificationMessages.push(result);
        state.statisticClarificationActivity++;
        onActivity(state);
      });
    }
  };
  var handleInput = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.clarificationInput = event.target.value;
  };
  var handleReset2 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.clarificationError = false;
    profile2.clarificationMessages = [];
    profile2.clarificationPending = false;
  };
  var handleBack4 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var clarification = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        node("label", {
          for: "input-question"
        }, translate(state, "clarification-intro"))
      ]),
      ...conditional(profile2.clarificationMessages && profile2.clarificationMessages.length > 0, node("div", {
        class: "messages"
      }, profile2.clarificationMessages.map((message) => node("p", {
        class: "message-" + message?.role
      }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))))),
      ...conditional(profile2.clarificationError, node("p", profile2.clarificationError)),
      ...conditional(profile2.clarificationPending, node("p", {
        class: "pending"
      }), node("textarea", {
        class: "message-user",
        id: "input-question",
        placeholder: translate(state, "clarification-placeholder"),
        keyup: handleInput
      }, profile2.clarificationInput)),
      node("div", {
        class: "row reverse"
      }, [
        node("button", {
          disabled: profile2.clarificationPending || !profile2.clarificationInput || profile2.clarificationInput.trim().length === 0,
          type: "button",
          click: handleAsk
        }, translate(state, "button-ask")),
        ...conditional(profile2.clarificationPending || profile2.clarificationMessages && profile2.clarificationMessages.length > 0, node("button", {
          type: "button",
          click: handleReset2
        }, translate(state, "button-reset"))),
        node("button", {
          type: "button",
          click: handleBack4
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/shared/utilities/random.js
  var randomBool = (odds) => {
    odds = Math.abs(odds);
    return Math.random() < 1 / odds;
  };
  var randomItem = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index];
  };

  // src/toaln/screens/exercises/comprehension.js
  var handleInput2 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.comprehensionInput = event.target.value;
  };
  var handleAnswer = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.comprehensionPending && profile2.comprehensionInput && profile2.comprehensionInput.trim().length > 0) {
      profile2.comprehensionError = false;
      profile2.comprehensionPending = true;
      profile2.comprehensionMessages.push({
        role: "user",
        content: profile2.comprehensionInput.trim()
      });
      profile2.comprehensionInput = "";
      createMessage6(state, profile2.comprehensionMessages, translate(state, "prompt-context"), translate(state, "prompt-comprehension-follow_up")).then(([error, _response, result]) => {
        profile2.comprehensionPending = false;
        if (error) {
          profile2.comprehensionError = error.toString();
          const message = profile2.comprehensionMessages.pop();
          profile2.comprehensionInput = message.content;
          return;
        }
        profile2.comprehensionMessages.push(result);
        state.statisticComprehensionActivity++;
        onActivity(state);
      });
    }
  };
  var handleGenerate = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.comprehensionPending) {
      profile2.comprehensionError = false;
      profile2.comprehensionMessages = [];
      profile2.comprehensionPending = true;
      createMessage6(state, [], translate(state, "prompt-context"), translate(state, "prompt-comprehension") + (randomBool(10) ? translate(state, "prompt-topic").replace("{%topic%}", randomItem(profile2.topicsOfInterest.filter((topic) => topic))) : "")).then(([error, _response, result]) => {
        profile2.comprehensionPending = false;
        if (error) {
          profile2.comprehensionError = error.toString();
          return;
        }
        profile2.comprehensionMessages.push(result);
      });
    }
  };
  var handleReset3 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.comprehensionError = false;
    profile2.comprehensionInput = "";
    profile2.comprehensionMessages = [];
    profile2.comprehensionPending = false;
  };
  var handleBack5 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var comprehension = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        translate(state, "comprehension-intro")
      ]),
      ...conditional(profile2.comprehensionMessages && profile2.comprehensionMessages.length > 0, node("div", {
        class: "messages"
      }, profile2.comprehensionMessages.map((message) => node("p", {
        class: "message-" + message?.role
      }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))))),
      ...conditional(profile2.comprehensionError, node("p", profile2.comprehensionError)),
      ...conditional(profile2.comprehensionPending, node("p", {
        class: "pending"
      }), conditional(profile2.comprehensionMessages && profile2.comprehensionMessages.length > 0 && profile2.comprehensionMessages.length < 3, node("textarea", {
        class: "message-user",
        id: "input-question",
        keyup: handleInput2
      }, profile2.comprehensionInput))),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(profile2.comprehensionMessages && profile2.comprehensionMessages.length > 0 && profile2.comprehensionMessages.length < 3, node("button", {
          disabled: profile2.comprehensionPending || !profile2.comprehensionInput || profile2.comprehensionInput.trim().length === 0,
          type: "button",
          click: handleAnswer
        }, translate(state, "button-answer")), node("button", {
          disabled: profile2.comprehensionPending,
          type: "button",
          click: handleGenerate
        }, translate(state, "button-generate"))),
        ...conditional(profile2.comprehensionPending || profile2.comprehensionMessages && profile2.comprehensionMessages.length > 0, node("button", {
          click: handleReset3,
          type: "button"
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack5,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/screens/exercises/conversation.js
  var handleReply = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.conversationPending && profile2.conversationInput && profile2.conversationInput.trim().length > 0) {
      profile2.conversationError = false;
      profile2.conversationPending = true;
      profile2.conversationMessages.push({
        role: "user",
        content: profile2.conversationInput.trim()
      });
      profile2.conversationInput = "";
      createMessage6(state, profile2.conversationMessages, translate(state, "prompt-context"), translate(state, "prompt-conversation-follow_up")).then(([error, _response, result]) => {
        profile2.conversationPending = false;
        if (error) {
          profile2.conversationError = error.toString();
          const message = profile2.conversationMessages.pop();
          profile2.conversationInput = message.content;
          return;
        }
        if (result.content.trim().endsWith("STOP")) {
          profile2.conversationStopped = true;
        }
        profile2.conversationMessages.push(result);
        state.statisticConversationActivity++;
        onActivity(state);
      });
    }
  };
  var handleGenerate2 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.conversationPending) {
      profile2.conversationError = false;
      profile2.conversationMessages = [];
      profile2.conversationPending = true;
      createMessage6(state, [], translate(state, "prompt-context"), translate(state, "prompt-conversation") + (randomBool(10) ? translate(state, "prompt-topic").replace("{%topic%}", randomItem(profile2.topicsOfInterest.filter((topic) => topic))) : "")).then(([error, _response, result]) => {
        profile2.conversationPending = false;
        if (error) {
          profile2.conversationError = error.toString();
          return;
        }
        profile2.conversationMessages.push(result);
      });
    }
  };
  var handleReset4 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.conversationError = false;
    profile2.conversationMessages = [];
    profile2.conversationPending = false;
    profile2.conversationStopped = false;
  };
  var handleBack6 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var handleInput3 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.conversationInput = event.target.value;
  };
  var conversation = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        translate(state, "conversation-intro")
      ]),
      ...conditional(profile2.conversationMessages && profile2.conversationMessages.length > 0, node("div", {
        class: "messages"
      }, profile2.conversationMessages.map((message) => node("p", {
        class: "message-" + message?.role
      }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))))),
      ...conditional(profile2.conversationError, node("p", profile2.conversationError)),
      ...conditional(profile2.conversationPending, node("p", {
        class: "pending"
      }), conditional(profile2.conversationMessages && profile2.conversationMessages.length > 0, node("textarea", {
        class: "message-user",
        id: "input-question",
        keyup: handleInput3
      }, profile2.conversationInput))),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(profile2.conversationMessages && profile2.conversationMessages.length > 0 && !profile2.conversationStopped, node("button", {
          disabled: profile2.conversationPending || !profile2.conversationInput || profile2.conversationInput.trim().length === 0,
          type: "button",
          click: handleReply
        }, translate(state, "button-reply")), node("button", {
          disabled: profile2.conversationPending,
          type: "button",
          click: handleGenerate2
        }, translate(state, "button-generate"))),
        ...conditional(profile2.conversationPending || profile2.conversationMessages && profile2.conversationMessages.length > 0, node("button", {
          click: handleReset4,
          type: "button"
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack6,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/screens/exercises/reading.js
  var handleInput4 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.readingInput = event.target.value;
  };
  var handleGenerate3 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.readingPending) {
      profile2.readingError = false;
      profile2.readingMessages = [];
      profile2.readingPending = true;
      let instructions = translate(state, "prompt-reading");
      if (profile2.readingInput && profile2.readingInput.trim().length > 0) {
        profile2.readingMessages.push({
          role: "user",
          content: profile2.readingInput.trim()
        });
        instructions += " " + translate(state, "prompt-reading-topic");
      }
      createMessage6(state, profile2.readingMessages, translate(state, "prompt-context"), instructions).then(([error, _response, result]) => {
        profile2.readingPending = false;
        if (error) {
          profile2.readingError = error.toString();
          return;
        }
        profile2.readingMessages.push(result);
        state.statisticReadingActivity++;
        onActivity(state);
      });
    }
  };
  var handleReset5 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.readingError = false;
    profile2.readingInput = "";
    profile2.readingMessages = [];
    profile2.readingPending = false;
  };
  var handleBack7 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var reading = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        node("label", {
          for: "input-topic"
        }, translate(state, "reading-intro"))
      ]),
      node("div", {
        class: "messages"
      }, [
        ...conditional(profile2.readingMessages && profile2.readingMessages?.length > 0, profile2.readingMessages?.map((message) => node("p", {
          class: "message-" + message?.role
        }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))), node("textarea", {
          class: "message-user",
          disabled: profile2.readingMessages?.length > 0,
          id: "input-topic",
          input: handleInput4,
          placeholder: translate(state, "reading-placeholder")
        }, profile2.readingInput || ""))
      ]),
      ...conditional(profile2.readingError, node("p", profile2.readingError)),
      ...conditional(profile2.readingPending, node("p", {
        class: "pending"
      })),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(profile2.readingPending || profile2.readingMessages && profile2.readingMessages?.length === 0, node("button", {
          click: handleGenerate3,
          disabled: profile2.readingPending,
          type: "button"
        }, translate(state, "button-generate"))),
        ...conditional(profile2.readingPending || profile2.readingMessages && profile2.readingMessages?.length > 0, node("button", {
          type: "button",
          click: handleReset5
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack7,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/screens/exercises/rewrite.js
  var handleInput5 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.rewriteInput = event.target.value;
  };
  var handleRewrite2 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.rewritePending) {
      profile2.rewriteError = false;
      profile2.rewriteMessages = [{
        role: "user",
        content: profile2.rewriteInput.trim()
      }];
      profile2.rewritePending = true;
      createMessage6(state, profile2.rewriteMessages, translate(state, "prompt-context"), translate(state, "prompt-rewrite")).then(([error, _response, result]) => {
        profile2.rewritePending = false;
        if (error) {
          profile2.rewriteError = error.toString();
          return;
        }
        profile2.rewriteMessages.push(result);
        state.statisticRewriteActivity++;
        onActivity(state);
      });
    }
  };
  var handleReset6 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.rewriteError = false;
    profile2.rewriteInput = "";
    profile2.rewriteMessages = [];
    profile2.rewritePending = false;
  };
  var handleBack8 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var rewrite = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        node("label", {
          for: "input-text"
        }, translate(state, "rewrite-intro"))
      ]),
      node("div", {
        class: "messages"
      }, [
        ...conditional(profile2.rewriteMessages && profile2.rewriteMessages.length > 0, profile2.rewriteMessages.map((message) => node("p", {
          class: "message-" + message.role
        }, message.content.split(`
`).flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))), node("textarea", {
          class: "message-user",
          disabled: profile2.rewriteMessages && profile2.rewriteMessages.length > 0,
          id: "input-text",
          input: handleInput5,
          placeholder: translate(state, "rewrite-placeholder")
        }, profile2.rewriteInput))
      ]),
      ...conditional(profile2.rewriteError, node("p", profile2.rewriteError)),
      ...conditional(profile2.rewritePending, node("p", {
        class: "pending"
      })),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(profile2.rewritePending || profile2.rewriteMessages && profile2.rewriteMessages.length === 0, node("button", {
          click: handleRewrite2,
          disabled: profile2.rewritePending || profile2.rewriteInput.trim().length === 0,
          type: "button"
        }, translate(state, "button-rewrite"))),
        ...conditional(profile2.rewritePending || profile2.rewriteMessages && profile2.rewriteMessages.length > 0, node("button", {
          type: "button",
          click: handleReset6
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack8,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/screens/exercises/story.js
  var handleInput6 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.storyInput = event.target.value;
  };
  var handleReply2 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.storyPending && profile2.storyInput && profile2.storyInput.trim().length > 0) {
      profile2.storyError = false;
      profile2.storyPending = true;
      profile2.storyMessages.push({
        role: "user",
        content: profile2.storyInput.trim()
      });
      profile2.storyInput = "";
      createMessage6(state, profile2.storyMessages, translate(state, "prompt-context"), translate(state, "prompt-story-follow_up")).then(([error, _response, result]) => {
        profile2.storyPending = false;
        if (error) {
          profile2.storyError = error.toString();
          const message = profile2.storyMessages.pop();
          profile2.storyInput = message.content;
          return;
        }
        if (result.content.endsWith("STOP")) {
          profile2.storyStopped = true;
        }
        profile2.storyMessages.push(result);
        state.statisticStoryActivity++;
        onActivity(state);
      });
    }
  };
  var handleGenerate4 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.storyPending) {
      profile2.storyError = false;
      profile2.storyMessages = [];
      profile2.storyPending = true;
      createMessage6(state, [], translate(state, "prompt-context"), translate(state, "prompt-story") + (randomBool(10) ? translate(state, "prompt-topic").replace("{%topic%}", randomItem(profile2.topicsOfInterest.filter((topic) => topic))) : "")).then(([error, _response, result]) => {
        profile2.storyPending = false;
        if (error) {
          profile2.storyError = error.toString();
          return;
        }
        profile2.storyMessages.push(result);
      });
    }
  };
  var handleReset7 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.storyError = false;
    profile2.storyMessages = [];
    profile2.storyPending = false;
    profile2.storyStopped = false;
  };
  var handleBack9 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var story = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        translate(state, "story-intro")
      ]),
      ...conditional(profile2.storyMessages && profile2.storyMessages.length > 0, node("div", {
        class: "messages"
      }, profile2.storyMessages.map((message) => node("p", {
        class: "message-" + message?.role
      }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))))),
      ...conditional(profile2.storyError, node("p", profile2.storyError)),
      ...conditional(profile2.storyPending, node("p", {
        class: "pending"
      }), conditional(profile2.storyMessages && profile2.storyMessages.length > 0, node("textarea", {
        class: "message-user",
        id: "input-question",
        keyup: handleInput6
      }, profile2.storyInput))),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(profile2.storyMessages && profile2.storyMessages.length > 0 && !profile2.storyStopped, node("button", {
          disabled: profile2.storyPending || !profile2.storyInput || profile2.storyInput.trim().length === 0,
          type: "button",
          click: handleReply2
        }, translate(state, "button-reply")), node("button", {
          disabled: profile2.storyPending,
          type: "button",
          click: handleGenerate4
        }, translate(state, "button-generate"))),
        ...conditional(profile2.storyPending || profile2.storyMessages && profile2.storyMessages.length > 0, node("button", {
          click: handleReset7,
          type: "button"
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack9,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/screens/exercises/typing.js
  var TYPING_LENGTHS = [
    "short",
    "medium",
    "long",
    "extra_long"
  ];
  var handleInput7 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.typingInput = event.target.value;
  };
  var handleLengthChange = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.typingLength = event.target.value;
  };
  var handleGenerate5 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.typingPending) {
      profile2.typingError = false;
      profile2.typingMessage = null;
      profile2.typingPending = true;
      profile2.typingCurrentIndex = 0;
      profile2.typingMistakes = 0;
      profile2.typingStartTime = null;
      const messages = [];
      if (profile2.typingInput && profile2.typingInput.trim().length > 0) {
        messages.push({
          role: "user",
          content: profile2.typingInput.trim()
        });
      }
      createMessage6(state, messages, translate(state, "prompt-context"), translate(state, "prompt-typing").replace("{%typingLength%}", translate(state, "typing-length_" + (profile2.typingLength ?? TYPING_LENGTHS[0])))).then(([error, _response, result]) => {
        profile2.typingPending = false;
        if (error) {
          profile2.typingError = error.toString();
          return;
        }
        profile2.typingMessage = result.content;
        profile2.typingCurrentIndex = 0;
        profile2.typingMistakes = 0;
        profile2.typingStartTime = null;
        profile2.typingEndTime = null;
        requestAnimationFrame(() => {
          handleTypingClick();
          scrollToCurrentCharacter(state);
        });
      });
    }
  };
  var handleReset8 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.typingCurrentIndex = 0;
    profile2.typingEndTime = null;
    profile2.typingError = false;
    profile2.typingInput = "";
    profile2.typingMessage = null;
    profile2.typingMistakes = 0;
    profile2.typingPending = false;
    profile2.typingStartTime = null;
  };
  var handleBack10 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var handleRestart = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.typingMessage) {
      return;
    }
    profile2.typingComposing = null;
    profile2.typingCurrentIndex = 0;
    profile2.typingEndTime = null;
    profile2.typingMistakes = 0;
    profile2.typingStartTime = null;
    requestAnimationFrame(() => {
      handleTypingClick();
      scrollToCurrentCharacter(state);
    });
  };
  var handleKeyDown = (event, state) => {
    const profile2 = getActiveProfile(state);
    const text = profile2.typingMessage;
    if (event.altKey || event.isComposing || !text || profile2.typingEndTime || profile2.typingPending) {
      return;
    }
    const key = event.key;
    if (key.length !== 1) {
      return;
    }
    if (!profile2.typingStartTime) {
      profile2.typingStartTime = Date.now();
    }
    const currentCharacter = text[profile2.typingCurrentIndex];
    if (key === currentCharacter) {
      profile2.typingCurrentIndex++;
      if (profile2.typingCurrentIndex >= text.length) {
        profile2.typingEndTime = Date.now();
        state.statisticTypingActivity++;
        onActivity(state);
      }
      requestAnimationFrame(() => scrollToCurrentCharacter(state));
    } else {
      profile2.typingMistakes++;
    }
  };
  var handleCompositionEnd = (event, state) => {
    const profile2 = getActiveProfile(state);
    const text = profile2.typingMessage;
    if (!text || profile2.typingEndTime || profile2.typingPending) {
      return;
    }
    if (!profile2.typingStartTime) {
      profile2.typingStartTime = Date.now();
    }
    const composedCharacter = event.data;
    const currentCharacter = text[profile2.typingCurrentIndex];
    if (composedCharacter === currentCharacter) {
      profile2.typingCurrentIndex++;
      if (profile2.typingCurrentIndex >= text.length) {
        profile2.typingEndTime = Date.now();
        state.statisticTypingActivity++;
        onActivity(state);
      }
      requestAnimationFrame(() => scrollToCurrentCharacter(state));
    } else {
      profile2.typingMistakes++;
    }
  };
  var handleTypingClick = () => {
    document.querySelector(".typing-input-hidden")?.focus();
  };
  var scrollToCurrentCharacter = (state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.typingMessage || profile2.typingCurrentIndex < 0) {
      return;
    }
    const container = document.querySelector(".typing-text-container");
    const currentElement = document.querySelector(".typing-text .current");
    if (!container || !currentElement) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const elementRect = currentElement.getBoundingClientRect();
    const elementCenter = elementRect.top - containerRect.top + elementRect.height / 2;
    const containerCenter = containerRect.height / 2;
    container.scrollTop += elementCenter - containerCenter;
  };
  var formatResultsSummary = (state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.typingMessage) {
      return "";
    }
    const text = profile2.typingMessage;
    const words = text.split(/[\s.,!?;:]+/).filter((word) => word.length > 0).length;
    const elapsed = (profile2.typingEndTime ?? Date.now()) - profile2.typingStartTime;
    const wordsPerMinute = Math.round(words / (elapsed / 60000));
    const accuracy = Math.round(profile2.typingCurrentIndex / (profile2.typingCurrentIndex + profile2.typingMistakes) * 100);
    return translate(state, "typing-results-summary").replace("{%accuracy%}", accuracy).replace("{%characters%}", text.length).replace("{%minutes%}", Math.floor(elapsed / 60000)).replace("{%mistakes%}", profile2.typingMistakes).replace("{%seconds%}", Math.floor(elapsed % 60000 / 1000)).replace("{%words%}", words).replace("{%wpm%}", wordsPerMinute);
  };
  var typing = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        translate(state, "typing-intro")
      ]),
      node("div", [
        ...conditional(profile2.typingPending, node("p", {
          class: "pending"
        })),
        node("div", {
          class: "messages"
        }, [
          ...conditional(!profile2.typingPending && !profile2.typingMessage, [
            node("textarea", {
              class: "message-user",
              id: "input-topic",
              input: handleInput7,
              placeholder: translate(state, "typing-placeholder")
            }, profile2.typingInput || ""),
            node("label", {
              for: "typing-input_length",
              class: "sr-only"
            }, translate(state, "typing-length_select")),
            node("select", {
              id: "typing-input_length",
              change: handleLengthChange
            }, TYPING_LENGTHS.map((length) => node("option", {
              value: length,
              selected: profile2.typingLength === length
            }, translate(state, "typing-length_" + length))))
          ]),
          ...conditional(profile2.typingMessage, [
            node("input", {
              type: "text",
              class: "typing-input-hidden",
              keydown: handleKeyDown,
              compositionend: handleCompositionEnd,
              autocapitalize: "off",
              autocorrect: "off",
              autocomplete: "off",
              spellcheck: false
            }),
            node("p", {
              class: "message-user typing-text-container",
              click: handleTypingClick
            }, [
              node("code", {
                class: "typing-text"
              }, (profile2.typingMessage ?? "").split("").map((character, index) => {
                let characterClass = "remaining";
                if (index < profile2.typingCurrentIndex) {
                  characterClass = "completed";
                } else if (index === profile2.typingCurrentIndex) {
                  characterClass = "current";
                }
                if (character === " ") {
                  character = " ​";
                }
                return node("span", {
                  class: characterClass
                }, character);
              }))
            ]),
            ...conditional(profile2.typingEndTime, node("p", {
              class: "message-assistant"
            }, [
              node("p", translate(state, "typing-completed")),
              node("p", formatResultsSummary(state))
            ]))
          ])
        ])
      ]),
      ...conditional(profile2.typingError, node("p", profile2.typingError)),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(!profile2.typingPending && !profile2.typingMessage, node("button", {
          click: handleGenerate5,
          disabled: profile2.typingPending,
          type: "button"
        }, translate(state, "button-generate"))),
        ...conditional(profile2.typingEndTime, node("button", {
          type: "button",
          click: handleRestart
        }, translate(state, "typing-restart"))),
        ...conditional(!profile2.typingPending && profile2.typingMessage, node("button", {
          type: "button",
          click: handleReset8
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack10,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/screens/exercises/vocabulary.js
  var handleInput8 = (event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.vocabularyInput = event.target.value;
  };
  var handleAnswer2 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.vocabularyPending && profile2.vocabularyInput && profile2.vocabularyInput.trim().length > 0) {
      profile2.vocabularyError = false;
      profile2.vocabularyPending = true;
      profile2.vocabularyMessages.push({
        role: "user",
        content: profile2.vocabularyInput.trim()
      });
      profile2.vocabularyInput = "";
      createMessage6(state, profile2.vocabularyMessages, translate(state, "prompt-context"), translate(state, "prompt-vocabulary-follow_up")).then(([error, _response, result]) => {
        profile2.vocabularyPending = false;
        if (error) {
          profile2.vocabularyError = error.toString();
          const message = profile2.vocabularyMessages.pop();
          profile2.vocabularyInput = message.content;
          return;
        }
        profile2.vocabularyMessages.push(result);
        state.statisticVocabularyActivity++;
        onActivity(state);
      });
    }
  };
  var handleGenerate6 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    if (!profile2.vocabularyPending) {
      profile2.vocabularyError = false;
      profile2.vocabularyMessages = [];
      profile2.vocabularyPending = true;
      createMessage6(state, [], translate(state, "prompt-context"), translate(state, "prompt-vocabulary")).then(([error, _response, result]) => {
        profile2.vocabularyPending = false;
        if (error) {
          profile2.vocabularyError = error.toString();
          return;
        }
        profile2.vocabularyMessages.push(result);
      });
    }
  };
  var handleReset9 = (_event, state) => {
    const profile2 = getActiveProfile(state);
    profile2.vocabularyError = false;
    profile2.vocabularyMessages = [];
    profile2.vocabularyPending = false;
  };
  var handleBack11 = (_event, state) => {
    setScreen(state, SCREENS.overview);
  };
  var vocabulary = (state) => {
    const profile2 = getActiveProfile(state);
    return [
      node("p", [
        node("b", translate(state, "greeting")),
        node("br"),
        translate(state, "vocabulary-intro")
      ]),
      ...conditional(profile2.vocabularyMessages && profile2.vocabularyMessages.length > 0, node("div", {
        class: "messages"
      }, profile2.vocabularyMessages.map((message) => node("p", {
        class: "message-" + message?.role
      }, message?.content?.split(`
`)?.flatMap((content, index, results) => index === results.length - 1 ? [content] : [content, node("br")]))))),
      ...conditional(profile2.vocabularyError, node("p", profile2.vocabularyError)),
      ...conditional(profile2.vocabularyPending, node("p", {
        class: "pending"
      }), conditional(profile2.vocabularyMessages && profile2.vocabularyMessages.length > 0 && profile2.vocabularyMessages.length < 3, node("textarea", {
        class: "message-user",
        id: "input-question",
        keyup: handleInput8
      }, profile2.vocabularyInput))),
      node("div", {
        class: "row reverse"
      }, [
        ...conditional(profile2.vocabularyMessages && profile2.vocabularyMessages.length > 0 && profile2.vocabularyMessages.length < 3, node("button", {
          disabled: profile2.vocabularyPending || !profile2.vocabularyInput || profile2.vocabularyInput.trim().length === 0,
          type: "button",
          click: handleAnswer2
        }, translate(state, "button-answer")), node("button", {
          disabled: profile2.vocabularyPending,
          type: "button",
          click: handleGenerate6
        }, translate(state, "button-generate"))),
        ...conditional(profile2.vocabularyPending || profile2.vocabularyMessages && profile2.vocabularyMessages.length > 0, node("button", {
          click: handleReset9,
          type: "button"
        }, translate(state, "button-reset"))),
        node("button", {
          click: handleBack11,
          type: "button"
        }, translate(state, "button-go_back"))
      ])
    ];
  };

  // src/toaln/utilities/context-menu.js
  var getSelection = () => {
    const selection = window.getSelection();
    let context = "";
    if (selection.anchorNode) {
      if (selection.anchorNode === selection.focusNode) {
        context = selection.anchorNode.textContent.trim();
      } else {
        const range = selection.getRangeAt(0).cloneRange();
        range.setStart(selection.anchorNode, 0);
        range.setEnd(selection.focusNode, selection.focusNode.length);
        const fragment = range.cloneContents();
        context = Array.from(fragment.childNodes).map((node3) => node3.textContent).join(" ").trim();
      }
    }
    return {
      context,
      text: selection?.toString().trim() ?? ""
    };
  };
  var handleContextMenu = (state) => {
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      state.contextMenu = {
        pointerX: event.pageX,
        pointerY: event.pageY
      };
      state.selection = getSelection();
      document.addEventListener("click", () => {
        state.contextMenu = null;
        state.selection = null;
      }, {
        once: true
      });
    });
  };

  // src/toaln/utilities/manifest.js
  var handleStartup = (state) => {
    const searchParameters = new URLSearchParams(window.location.search);
    if (!isReady(state)) {
      return;
    }
    const screen = searchParameters.get("screen");
    if (screen !== SCREENS.setup) {
      setScreen(state, screen);
    }
  };

  // src/shared/utilities/sw.js
  var appState;
  var messages = [];
  var handleMessage = (state, event) => {
    switch (event?.data?.type) {
      case "cacheUpdate":
        state.appUpdateAvailable = true;
        break;
    }
  };
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.min.js", {
      scope: "./"
    });
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (appState) {
        handleMessage(appState, event);
      } else {
        messages.push(event);
      }
    });
  }
  var handleUpdates = (state) => {
    for (const message of messages) {
      handleMessage(state, message);
    }
    appState = state;
    messages = null;
  };

  // src/toaln/app.js
  var initialize = () => {
    const preferredLocale = getPreferredLocale();
    const [_update, _unmount, state] = mount(document.body.appendChild(document.createElement("div")), (state2) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state2));
      return node("div", {
        class: "screen"
      }, [
        ...updateBanner(state2),
        ...match(state2.screen, {
          [SCREENS.migrate]: () => migrate(state2),
          [SCREENS.options]: () => options(state2),
          [SCREENS.overview]: () => overview(state2),
          [SCREENS.profile]: () => profile(state2),
          [SCREENS.clarification]: () => clarification(state2),
          [SCREENS.comprehension]: () => comprehension(state2),
          [SCREENS.conversation]: () => conversation(state2),
          [SCREENS.reading]: () => reading(state2),
          [SCREENS.rewrite]: () => rewrite(state2),
          [SCREENS.story]: () => story(state2),
          [SCREENS.typing]: () => typing(state2),
          [SCREENS.vocabulary]: () => vocabulary(state2)
        }, () => setup(state2)),
        ...popupModal(state2),
        ...contextMenu(state2)
      ]);
    }, Object.assign({
      screen: SCREENS.setup,
      userIdentifier: createIdentifier2(),
      appUpdateAvailable: false,
      contextMenu: null,
      selection: null,
      popupModal: null,
      sourceLocale: preferredLocale,
      sourceLanguage: getLanguageFromLocale(preferredLocale),
      apiProvider: APIS.google.code,
      apiModels: null,
      apiModel: apiSettings3.preferredModel,
      apiModelTemprature: 0.5,
      apiCredentials: null,
      apiCredentialsError: false,
      apiCredentialsPending: false,
      apiCredentialsTested: false,
      profiles: [],
      activeProfileId: null,
      statisticCurrentActivityStreak: 0,
      statisticLastActivityOn: null,
      statisticLongestActivityStreak: 0,
      statisticClarificationActivity: 0,
      statisticComprehensionActivity: 0,
      statisticConversationActivity: 0,
      statisticReadingActivity: 0,
      statisticRewriteActivity: 0,
      statisticStoryActivity: 0,
      statisticTypingActivity: 0,
      statisticVocabularyActivity: 0,
      migrateImportError: false,
      migrateReset: false
    }, window.localStorage.getItem(STORAGE_KEY) ? JSON.parse(window.localStorage.getItem(STORAGE_KEY)) : {}, {
      appUpdateAvailable: false,
      apiCredentialsPending: false
    }));
    setLangAttribute(state);
    handleContextMenu(state);
    handleHistory(state);
    handleStartup(state);
    handleUpdates(state);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();

//# debugId=AB2855D8C138FCE464756E2164756E21
