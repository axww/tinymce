import { Arr, Fun, Obj, Optional, Strings, Type } from '@ephox/katamari';
import { Attribute, NodeTypes, Remove, Replication, SugarElement } from '@ephox/sugar';
import createDompurify, { Config, DOMPurify, UponSanitizeAttributeHookEvent, UponSanitizeElementHookEvent } from 'dompurify';

import { DomParserSettings } from '../api/html/DomParser';
import Schema from '../api/html/Schema';
import Tools from '../api/util/Tools';
import * as URI from '../api/util/URI';
import * as NodeType from '../dom/NodeType';

import * as KeepHtmlComments from './KeepHtmlComments';
import * as Namespace from './Namespace';

export type MimeType = 'text/html' | 'application/xhtml+xml';

interface Sanitizer {
  readonly sanitizeHtmlElement: (body: HTMLElement, mimeType: MimeType) => void;
  readonly sanitizeNamespaceElement: (el: Element) => void;
}

// A list of attributes that should be filtered further based on the parser settings
const filteredUrlAttrs = Tools.makeMap('src,href,data,background,action,formaction,poster,xlink:href');
const internalElementAttr = 'data-mce-type';

let uid = 0;
const processNode = (node: Node, settings: DomParserSettings, schema: Schema, scope: Namespace.NamespaceType, evt?: UponSanitizeElementHookEvent): void => {
  const validate = settings.validate;
  const specialElements = schema.getSpecialElements();

  if (node.nodeType === NodeTypes.COMMENT) {
    // Pad conditional comments if they aren't allowed
    if (!settings.allow_conditional_comments && /^\[if/i.test(node.nodeValue ?? '')) {
      node.nodeValue = ' ' + node.nodeValue;
    }

    if (settings.sanitize && settings.allow_html_in_comments && Type.isString(node.nodeValue)) {
      node.nodeValue = KeepHtmlComments.encodeData(node.nodeValue);
    }
  }

  const lcTagName = evt?.tagName ?? node.nodeName.toLowerCase();

  if (scope !== 'html' && schema.isValid(scope)) {
    if (Type.isNonNullable(evt)) {
      evt.allowedTags[lcTagName] = true;
    }
    return;
  }

  // Just leave non-elements such as text and comments up to dompurify
  if (node.nodeType !== NodeTypes.ELEMENT || lcTagName === 'body') {
    return;
  }

  // Construct the sugar element wrapper
  const element = SugarElement.fromDom(node) as SugarElement<Element>;

  // Determine if we're dealing with an internal attribute
  const isInternalElement = Attribute.has(element, internalElementAttr);

  // Cleanup bogus elements
  const bogus = Attribute.get(element, 'data-mce-bogus');
  if (!isInternalElement && Type.isString(bogus)) {
    if (bogus === 'all') {
      Remove.remove(element);
    } else {
      Remove.unwrap(element);
    }
    return;
  }

  // Determine if the schema allows the element and either add it or remove it
  const rule = schema.getElementRule(lcTagName);
  if (validate && !rule) {
    // If a special element is invalid, then remove the entire element instead of unwrapping
    if (Obj.has(specialElements, lcTagName)) {
      Remove.remove(element);
    } else {
      Remove.unwrap(element);
    }
    return;
  } else {
    if (Type.isNonNullable(evt)) {
      evt.allowedTags[lcTagName] = true;
    }
  }

  // Validate the element using the attribute rules
  if (validate && rule && !isInternalElement) {
    // Fix the attributes for the element, unwrapping it if we have to
    Arr.each(rule.attributesForced ?? [], (attr) => {
      Attribute.set(element, attr.name, attr.value === '{$uid}' ? `mce_${uid++}` : attr.value);
    });
    Arr.each(rule.attributesDefault ?? [], (attr) => {
      if (!Attribute.has(element, attr.name)) {
        Attribute.set(element, attr.name, attr.value === '{$uid}' ? `mce_${uid++}` : attr.value);
      }
    });

    // If none of the required attributes were found then remove
    if (rule.attributesRequired && !Arr.exists(rule.attributesRequired, (attr) => Attribute.has(element, attr))) {
      Remove.unwrap(element);
      return;
    }

    // If there are no attributes then remove
    if (rule.removeEmptyAttrs && Attribute.hasNone(element)) {
      Remove.unwrap(element);
      return;
    }

    // Change the node name if the schema says to
    if (rule.outputName && rule.outputName !== lcTagName) {
      Replication.mutate(element, rule.outputName as keyof HTMLElementTagNameMap);
    }
  }
};

const processAttr = (ele: Element, settings: DomParserSettings, schema: Schema, scope: Namespace.NamespaceType, evt: UponSanitizeAttributeHookEvent) => {
  const tagName = ele.tagName.toLowerCase();
  const { attrName, attrValue } = evt;

  evt.keepAttr = shouldKeepAttribute(settings, schema, scope, tagName, attrName, attrValue);

  if (evt.keepAttr) {
    evt.allowedAttributes[attrName] = true;

    if (isBooleanAttribute(attrName, schema)) {
      evt.attrValue = attrName;
    }

    // We need to tell DOMPurify to forcibly keep the attribute if it's an SVG data URI and svg data URIs are allowed
    if (settings.allow_svg_data_urls && Strings.startsWith(attrValue, 'data:image/svg+xml')) {
      evt.forceKeepAttr = true;
    }
    // For internal elements always keep the attribute if the attribute name is id, class or style
  } else if (isRequiredAttributeOfInternalElement(ele, attrName)) {
    evt.forceKeepAttr = true;
  }
};

const shouldKeepAttribute = (settings: DomParserSettings, schema: Schema, scope: Namespace.NamespaceType, tagName: string, attrName: string, attrValue: string): boolean => {
  // All attributes within non HTML namespaces elements are considered valid
  if (scope !== 'html' && !Namespace.isNonHtmlElementRootName(tagName)) {
    return true;
  }

  return !(attrName in filteredUrlAttrs && URI.isInvalidUri(settings, attrValue, tagName)) &&
    (!settings.validate || schema.isValid(tagName, attrName) || Strings.startsWith(attrName, 'data-') || Strings.startsWith(attrName, 'aria-'));
};

const isRequiredAttributeOfInternalElement = (ele: Element, attrName: string): boolean =>
  ele.hasAttribute(internalElementAttr) && (attrName === 'id' || attrName === 'class' || attrName === 'style');

const isBooleanAttribute = (attrName: string, schema: Schema): boolean =>
  attrName in schema.getBoolAttrs();

const filterAttributes = (ele: Element, settings: DomParserSettings, schema: Schema, scope: Namespace.NamespaceType): void => {
  const { attributes } = ele;
  for (let i = attributes.length - 1; i >= 0; i--) {
    const attr = attributes[i];
    const attrName = attr.name;
    const attrValue = attr.value;
    if (!shouldKeepAttribute(settings, schema, scope, ele.tagName.toLowerCase(), attrName, attrValue) && !isRequiredAttributeOfInternalElement(ele, attrName)) {
      ele.removeAttribute(attrName);
    } else if (isBooleanAttribute(attrName, schema)) {
      ele.setAttribute(attrName, attrName);
    }
  }
};

const setupPurify = (settings: DomParserSettings, schema: Schema, namespaceTracker: Namespace.NamespaceTracker): DOMPurify => {
  const purify = createDompurify();

  // We use this to add new tags to the allow-list as we parse, if we notice that a tag has been banned but it's still in the schema
  purify.addHook('uponSanitizeElement', (ele, evt) => {
    processNode(ele, settings, schema, namespaceTracker.track(ele), evt);
  });

  // Let's do the same thing for attributes
  purify.addHook('uponSanitizeAttribute', (ele, evt) => {
    processAttr(ele, settings, schema, namespaceTracker.current(), evt);
  });

  return purify;
};

const getPurifyConfig = (settings: DomParserSettings, mimeType: MimeType): Config => {
  const basePurifyConfig: Config = {
    IN_PLACE: true,
    ALLOW_UNKNOWN_PROTOCOLS: true,
    // Deliberately ban all tags and attributes by default, and then un-ban them on demand in hooks
    // #comment and #cdata-section are always allowed as they aren't controlled via the schema
    // body is also allowed due to the DOMPurify checking the root node before sanitizing
    ALLOWED_TAGS: [ '#comment', '#cdata-section', 'body' ],
    ALLOWED_ATTR: []
  };
  const config = { ...basePurifyConfig };

  // Set the relevant parser mimetype
  config.PARSER_MEDIA_TYPE = mimeType;

  // Allow any URI when allowing script urls
  if (settings.allow_script_urls) {
    config.ALLOWED_URI_REGEXP = /.*/;
    // Allow anything except javascript (or similar) URIs if all html data urls are allowed
  } else if (settings.allow_html_data_urls) {
    config.ALLOWED_URI_REGEXP = /^(?!(\w+script|mhtml):)/i;
  }

  return config;
};

const sanitizeSvgElement = (ele: Element) => {
  // xlink:href used to be the way to do links in SVG 1.x https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href
  const xlinkAttrs = [ 'type', 'href', 'role', 'arcrole', 'title', 'show', 'actuate', 'label', 'from', 'to' ].map((name) => `xlink:${name}`);
  const config: Config = {
    IN_PLACE: true,
    USE_PROFILES: {
      html: true,
      svg: true,
      svgFilters: true
    },
    ALLOWED_ATTR: xlinkAttrs
  };

  createDompurify().sanitize(ele, config);

};

const sanitizeMathmlElement = (node: Element, settings: DomParserSettings) => {
  const config: Config = {
    IN_PLACE: true,
    USE_PROFILES: {
      mathMl: true
    },
  };

  const purify = createDompurify();
  const allowedEncodings = settings.allow_mathml_annotation_encodings;
  const hasAllowedEncodings = Type.isArray(allowedEncodings) && allowedEncodings.length > 0;
  const hasValidEncoding = (el: Element) => {
    const encoding = el.getAttribute('encoding');
    return hasAllowedEncodings && Type.isString(encoding) && Arr.contains(allowedEncodings, encoding);
  };

  const isValidElementOpt = (node: Node, lcTagName: string) => {
    if (hasAllowedEncodings && lcTagName === 'semantics') {
      return Optional.some(true);
    } else if (lcTagName === 'annotation') {
      return Optional.some(NodeType.isElement(node) && hasValidEncoding(node));
    } else if (Type.isArray(settings.extended_mathml_elements)) {
      if (settings.extended_mathml_elements.includes(lcTagName)) {
        return Optional.from(true);
      } else {
        return Optional.none();
      }
    } else {
      return Optional.none();
    }
  };

  purify.addHook('uponSanitizeElement', (node, evt) => {
    // We know the node is an element as we have
    // passed an element to the purify.sanitize function below
    const lcTagName = evt.tagName ?? node.nodeName.toLowerCase();
    const keepElementOpt = isValidElementOpt(node, lcTagName);

    keepElementOpt.each((keepElement) => {
      evt.allowedTags[lcTagName] = keepElement;
      if (!keepElement && settings.sanitize) {
        if (NodeType.isElement(node)) {
          node.remove();
        }
      }
    });
  });

  purify.addHook('uponSanitizeAttribute', (_node, event) => {
    if (Type.isArray(settings.extended_mathml_attributes)) {
      const keepAttribute = settings.extended_mathml_attributes.includes(event.attrName);

      if (keepAttribute) {
        event.forceKeepAttr = true;
      }
    }
  });

  purify.sanitize(node, config);
};

const mkSanitizeNamespaceElement = (settings: DomParserSettings) => (ele: Element) => {
  const namespaceType = Namespace.toScopeType(ele);

  if (namespaceType === 'svg') {
    sanitizeSvgElement(ele);
  } else if (namespaceType === 'math') {
    sanitizeMathmlElement(ele, settings);
  } else {
    throw new Error('Not a namespace element');
  }
};

const getSanitizer = (settings: DomParserSettings, schema: Schema): Sanitizer => {
  const namespaceTracker = Namespace.createNamespaceTracker();

  if (settings.sanitize) {
    const purify = setupPurify(settings, schema, namespaceTracker);
    const sanitizeHtmlElement = (body: HTMLElement, mimeType: MimeType) => {
      purify.sanitize(body, getPurifyConfig(settings, mimeType));
      purify.removed = [];
      namespaceTracker.reset();
    };

    return {
      sanitizeHtmlElement,
      sanitizeNamespaceElement: mkSanitizeNamespaceElement(settings)
    };
  } else {
    const sanitizeHtmlElement = (body: HTMLElement, _mimeType: MimeType) => {
      // eslint-disable-next-line no-bitwise
      const nodeIterator = document.createNodeIterator(body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT);
      let node;
      while ((node = nodeIterator.nextNode())) {
        const currentScope = namespaceTracker.track(node);

        processNode(node, settings, schema, currentScope);
        if (NodeType.isElement(node)) {
          filterAttributes(node, settings, schema, currentScope);
        }
      }

      namespaceTracker.reset();
    };

    const sanitizeNamespaceElement = Fun.noop;

    return {
      sanitizeHtmlElement,
      sanitizeNamespaceElement
    };
  }
};

export {
  getSanitizer,
  internalElementAttr
};
