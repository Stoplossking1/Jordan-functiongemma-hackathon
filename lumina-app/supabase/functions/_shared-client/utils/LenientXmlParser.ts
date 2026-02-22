import { isWhitespace } from './string-utils.ts';
import { lastElement } from './array-utils.ts';

enum ParserState {
  BEGIN = 0,
  BEGIN_WHITESPACE,
  TEXT,
  // TEXT_ENTITY,
  OPEN_WAKA,
  OPEN_TAG,
  OPEN_TAG_SLASH,
  CLOSE_TAG,
  CLOSE_TAG_SAW_WHITE,
}

// prettier-ignore
const nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
// prettier-ignore
// eslint-disable-next-line no-misleading-character-class
const nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

export interface XmlTag {
  name: string;
  attributes?: object; //Map<string, string>
  isSelfClosing?: boolean;
}

export enum TagCallbackType {
  OPEN_TAG_START = 0,
  OPEN_TAG,
  CLOSE_TAG,
  TEXT,
  END,
}

export type TagCallback = (cbType: TagCallbackType, text: string) => void;

export type TagTextCallback = (tag: string | undefined, text: string) => void;

export class LenientXmlParser {
  private state: ParserState = ParserState.BEGIN;
  private position = 0;
  private startTagPosition = 0;
  private textNode = '';
  private tagNameIncomplete = '';

  private tag?: XmlTag;
  private tags: Array<XmlTag> = [];
  private tagCallback?: TagCallback;
  private textCallback?: TagTextCallback;

  constructor(
    private trimWhitespace = false,
    // If true, then turn any whitespace into a single space.
    private normalizeWhitespace = false,
    // make all tags the same case by default to ignore casing differences
    private lowercase = true,
  ) {}

  parse(text: string, textCallback?: TagTextCallback, tagCallback?: TagCallback) {
    this.state = ParserState.BEGIN;
    this.position = 0;
    this.startTagPosition = 0;
    this.textNode = '';
    this.tagNameIncomplete = '';
    this.tag = undefined;
    this.tags = [];

    this.tagCallback = tagCallback;
    this.textCallback = textCallback;
    for (let i = 0; i < text.length; i++) {
      const c = text.charAt(i);
      switch (this.state) {
        case ParserState.BEGIN: {
          this.state = ParserState.BEGIN_WHITESPACE;
          this.beginWhiteSpace(c);
          break;
        }
        case ParserState.BEGIN_WHITESPACE: {
          this.beginWhiteSpace(c);
          break;
        }
        case ParserState.TEXT: {
          if (c === '<') {
            this.state = ParserState.OPEN_WAKA;
            this.startTagPosition = this.position;
          } else {
            // Text data outside of root node
            this.textNode += c;
          }
          break;
        }
        case ParserState.OPEN_WAKA: {
          // either a /, ?, !, or text is coming next.
          if (isWhitespace(c)) {
            // wait for it...
          } else if (nameStart.test(c)) {
            this.state = ParserState.OPEN_TAG;
            this.tagNameIncomplete = c;
          } else if (c === '/') {
            this.state = ParserState.CLOSE_TAG;
            this.tagNameIncomplete = '';
          } else {
            // this.strictFail('Unencoded <');
            // if there was some whitespace, then add that in.
            let c2 = c;
            if (this.startTagPosition + 1 < this.position) {
              const pad = this.position - this.startTagPosition;
              c2 = new Array(pad).join(' ') + c2;
            }
            this.textNode += '<' + c2;
            this.state = ParserState.TEXT;
          }
          break;
        }
        case ParserState.OPEN_TAG: {
          if (nameBody.test(c)) {
            this.tagNameIncomplete += c;
          } else {
            this.newTag();
            if (c === '>') {
              this.openTag(false);
            } else if (c === '/') {
              this.state = ParserState.OPEN_TAG_SLASH;
            } else {
              // if (!isWhitespace(c)) {
              //   this.strictFail('Invalid character in tag name');
              // }
              // this.state = ParserState.ATTRIB;
            }
          }
          break;
        }
        case ParserState.OPEN_TAG_SLASH: {
          if (c === '>') {
            this.openTag(true);
            this.closeTag();
          } else {
            // this.strictFail('Forward-slash in opening tag not followed by >');
            // this.state = this.S.ATTRIB;
          }
          break;
        }
        case ParserState.CLOSE_TAG: {
          if (!this.tagNameIncomplete) {
            if (isWhitespace(c)) {
              break;
            } else if (!nameStart.test(c)) {
              // Invalid tagname in closing tag.
            } else {
              this.tagNameIncomplete = c;
            }
          } else if (c === '>') {
            this.closeTag();
          } else if (nameBody.test(c)) {
            this.tagNameIncomplete += c;
          } else {
            // Invalid tagname in closing tag
            this.state = ParserState.CLOSE_TAG_SAW_WHITE;
          }
          break;
        }
        case ParserState.CLOSE_TAG_SAW_WHITE: {
          if (isWhitespace(c)) {
            break;
          }
          if (c === '>') {
            this.closeTag();
          } else {
            // Invalid characters in closing tag
          }
          break;
        }
        default:
          throw new Error(`Unknown state: ${this.state}`);
      }
    }
    this.end();
  }

  normalizeTagName(text: string): string {
    return this.lowercase ? text.toLowerCase() : text.toUpperCase();
  }

  newTag() {
    this.tagNameIncomplete = this.normalizeTagName(this.tagNameIncomplete);
    const tag = (this.tag = { name: this.tagNameIncomplete, attributes: {} });

    this.emitNode(TagCallbackType.OPEN_TAG_START, tag);
  }

  beginWhiteSpace(c: string) {
    if (c === '<') {
      this.state = ParserState.OPEN_WAKA;
      this.startTagPosition = this.position;
    } else if (!isWhitespace(c)) {
      // Non-whitespace before first tag.
      // have to process this as a text node.
      this.textNode = c;
      this.state = ParserState.TEXT;
    }
  }

  textApplyOptions(text: string): string {
    if (this.trimWhitespace) text = text.trim();
    if (this.normalizeWhitespace) text = text.replace(/\s+/g, ' ');
    return text;
  }

  closeText(containingTag?: XmlTag) {
    this.textNode = this.textApplyOptions(this.textNode);
    // TODO: figure out why this.textNode can be "" and "undefined"
    if (this.textNode !== undefined && this.textNode !== '' && this.textNode !== 'undefined') {
      if (this.tagCallback) this.tagCallback(TagCallbackType.TEXT, this.textNode);
      if (this.textCallback) this.textCallback(containingTag?.name, this.textNode);
    }
    this.textNode = '';
  }

  emitNode(callbackType: TagCallbackType, tag: XmlTag) {
    if (this.textNode) this.closeText(callbackType === TagCallbackType.CLOSE_TAG ? tag : lastElement(this.tags));
    if (this.tagCallback) this.tagCallback(callbackType, tag.name);
  }

  openTag(selfClosing: boolean) {
    if (this.tag) {
      this.tag.isSelfClosing = selfClosing;
      // process the tag
      this.tags.push(this.tag);
      this.emitNode(TagCallbackType.OPEN_TAG, this.tag);
    }
    if (!selfClosing) {
      this.state = ParserState.TEXT;
      this.tag = undefined;
      this.tagNameIncomplete = '';
    }
  }

  closeTag() {
    if (!this.tagNameIncomplete) {
      // Weird empty close tag.
      this.textNode += '</>';
      this.state = ParserState.TEXT;
      return;
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    let t = this.tags.length;
    const tagName = this.normalizeTagName(this.tagNameIncomplete);
    while (t--) {
      const close = this.tags[t];
      if (close.name !== tagName) {
        // Unexpected close tag
        // fail the first time in strict mode
      } else {
        break;
      }
    }
    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      // Unmatched closing tag: this.tagNameIncomplete
      // for now we just keep the text before and add whitespac but we could also add the tag text...
      this.textNode += ' ';
      // this.textNode += '</' + this.tagNameIncomplete + '>';
      this.state = ParserState.TEXT;
      return;
    }
    // this.tagName = tagName;
    let s = this.tags.length;
    while (s-- > t) {
      this.tag = this.tags.pop();
      if (this.tag) {
        this.emitNode(TagCallbackType.CLOSE_TAG, this.tag);
      }
    }

    this.tagNameIncomplete = '';
    this.state = ParserState.TEXT;
  }

  end() {
    if (
      this.state !== ParserState.BEGIN &&
      this.state !== ParserState.BEGIN_WHITESPACE &&
      this.state !== ParserState.TEXT
    ) {
      // Unexpected end
    }
    this.closeText(lastElement(this.tags));

    if (this.tagCallback) this.tagCallback(TagCallbackType.END, '');
  }
}
