exports.parse = function(string){
/**
 * 
 * This class is derived from the Stringtree JSON implementation under the Apache license
 * http://www.stringtree.org/stringtree-json.html
 *                                  Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

 */
    static Map escapes = new HashMap();
    static {
        escapes.put(new Character('"'), new Character('"'));
        escapes.put(new Character('\\'), new Character('\\'));
        escapes.put(new Character('/'), new Character('/'));
        escapes.put(new Character('b'), new Character('\b'));
        escapes.put(new Character('f'), new Character('\f'));
        escapes.put(new Character('n'), new Character('\n'));
        escapes.put(new Character('r'), new Character('\r'));
        escapes.put(new Character('t'), new Character('\t'));
    }
    static InternalToken KEYWORD_SYMBOL = new InternalToken();
    static Map symbols = new HashMap();
    static {
    	symbols.put("null",null);
    	symbols.put("true",true);
    	symbols.put("false",false);
    	symbols.put("new",KEYWORD_SYMBOL);
    	symbols.put("ref",KEYWORD_SYMBOL);
    	symbols.put("function",KEYWORD_SYMBOL);
    	symbols.put("undefined", Undefined.instance);
    	symbols.put("NaN", Double.NaN);
    	symbols.put("Infinity", Double.POSITIVE_INFINITY);
    }
    var column;
	function getLineNumber(){
		var index = it.getIndex();
		var c = it.first();
		var lineNumber = 1;
		column = 1;
		for(var i = 0; i < index; i++){
			if(c == '\n'){
				lineNumber++;
				column = 0;
			}
			else
				column++;
			c = it.next();
		}
		return lineNumber; 
	}
    
    CharacterIterator it;
    var c;
    token;
    var buf = new StringBuffer();
    var readingKey = false;

    var next() {
        c = it.next();
        return c;
    }

    function skipWhiteSpace() {
        while (Character.isWhitespace(c)) {
            next();
        }
    }

    function read(CharacterIterator ci, var start) {
        it = ci;
        switch (start) {
        case FIRST:
            c = it.first();
            value = read();
            skipWhiteSpace();
            if(c == CharacterIterator.DONE){
            	return value;
            }
            throw new SyntaxError("Unexpected additional characters encountered after finished JSON parse");
        case CURRENT:
            c = it.current();
            break;
        case NEXT:
            c = it.next();
            break;
        }
        return read();
    }

    function read(CharacterIterator it) {
        return read(it, NEXT);
    }

    function read(string) {
        return read(new StringCharacterIterator(string), FIRST);
    }
    function symbol(){
    	var sb = new StringBuffer();
    	while (Character.isLetterOrDigit(c) || c == '$' || c == '_'){
			sb.append(c);
			next();
    	}
    	return sb.toString();
    }
    
    function read() {
        skipWhiteSpace();
        var ch = c;
        next();
        switch (ch) {
            case '"':case '\'': token = string(ch); break;
            case '[': token = array(); break;
            case '{': token = object(); break;
            case ']': token = ARRAY_END; break;
            case ',': token = COMMA; break;
            case '}': token = OBJECT_END; break;
            case ')': token = PARANTHESIS_END; break;
            case ':': token = COLON; break;
            case '(': 
            	result = read(); 
            	if(read()!=PARANTHESIS_END)
            		throw new SyntaxError("Expected closing paranthesis");
            	return result;
            case CharacterIterator.DONE: 
                	throw new SyntaxError("Unexpected end of JSON message");
            default:
                c = it.previous();
                if (Character.isDigit(c) || c == '-') {
                    token = number();
                }
                else if (Character.isLetter(c) || c=='$' || c=='_') {
                	var first = c;
                	token = symbol();
                	if(readingKey)
                		return token;
                	globalValue;
                	// TODO: Use symbol map to lookup
                	//TODO: If it is a key in a map, we don't want to do this matching
                	if (first == 't' && "true".equals(token))
                		return true;
                	else if (first == 'f'){
                		if ("false".equals(token))
                			return false;
                    	else if ("function".equals(token))
                    		return function();
                	}
                	else if (first == 'n') {
                		if("null".equals(token))
                			return null;
                		else if("new".equals(token)){
                			skipWhiteSpace();
                			token = symbol();
                			if("Date".equals(token)){
                				date = read();
                				if(date instanceof Number)
                					return new Date(((Number)date).longValue());
								else
									try {
										return DateFormat.getDateTimeInstance().parse(date + "");
									} catch (ParseException e) {
										throw new RuntimeException(e);
									}
                			}
                			else throw new SyntaxError("Can only instantiate date objects");
                		}
                	}
                	else if (first == 'N' && "NaN".equals(token))
                		return Double.NaN;
                	else if (first == 'I' && "Infinite".equals(token))
                		return Double.POSITIVE_INFINITY;
                	else if (first == 'u' && "undefined".equals(token))
                		return;
                	else if (first == 'r' && "ref".equals(token)){
                		var refMap = {};
                		refMap.$ref = read();
                		return refMap;
                	}
                	else if ((globalValue = GlobalData.getGlobalScope().get((String) token, GlobalData.getGlobalScope())) instanceof IdFunction|| globalValue instanceof PersistableClass){
                		return globalValue;
                	}
                	else
                		return token;
                }
                else
                	throw new SyntaxError("Unexpected character " + ch);
        }
        // System.out.println("token: " + token); // enable this line to see the token stream
        return token;
    }
    function object(){
		var buf = new StringBuffer("function");
		var startedBody = false;
		var blockDepth = 0;
		for (;;) {
            buf.append(c);
            switch (c) {
	            case 0:
	                throw new SyntaxError("Invalid function syntax");
	            case '"':
	            case '\'':
            		var s = c;
	            	do {
	            		next();
		                buf.append(c);
		            	if (c == '\\') {
			                next();
		                	buf.append(c);
	            		} else if (s == c) {
	            			break;
	            		}
	            	} while (true);
	                break;
	            case '{' : 
	            	blockDepth++; startedBody = true; break;
	            case '}' : 
	            	if (--blockDepth == 0 && startedBody) {
	            		next();
	            		return new JSONFunction(buf.toString());
	            	}
	            	break;
	            case CharacterIterator.DONE: 
                	throw new SyntaxError("Unexpected end of JSON String");
	            case '/' :
	                c = next();
	                buf.append(c);
            		switch (c) {
            			case '/' : 		
            				do {
            					c = next();
            					buf.append(c);
            				} while (c != '\n' && c != '\r' && c != 0);
            				break;
            			case '*' :
            				do {
            					c = next();
            					buf.append(c);
            					if(c == '*') {
                					c = next();
                					buf.append(c);
                					if (c == '/')
                						break;
            					}
            				} while (true);
            				break;
            				
            		}
	            default:
            }
            next();
		}

    }
    
    function object() {
        var ret = {};
        readingKey = true;
        key = read();
        readingKey = false;
        while (token != OBJECT_END) {
        	read(); // should be a colon
            if (token != OBJECT_END) {
                ret.put(key, read());
                if (read() == COMMA) {
                    key = read();
                }
                else {
                	if (token == OBJECT_END)
                		return ret;
            		else
            			throw new SyntaxError("Expecting a , or }");
                }
                
            }
        }

        return ret;
    }

    function array() {
        var ret = new ArrayList();
        value = read();
        while (token != ']') {
            ret.add(value);
            if (read() == ',') {
                value = read();
            }
            else {
            	if (token == ']')
            		return ret;
        		else
        			throw new SyntaxError("Expecting a , or ]");
            }

        }
        return ret;
    }

    function number() {
        var length = 0;
        var isFloatingPovar = false;
        buf.setLength(0);
        
        if (c == '-') {
            add();
            if (c == 'I') {
            	if("Infinity".equals(symbol()))
            		return -Infinity;
            	throw new SyntaxError();
            }
        }
        length += addDigits();
        if (c == '.') {
            add();
            length += addDigits();
            isFloatingPovar = true;
        }
        if (c == 'e' || c == 'E') {
            add();
            if (c == '+' || c == '-') {
                add();
            }
            addDigits();
            isFloatingPovar = true;
        }
        JSON.parse(buf.toString());
    }
 
    var addDigits() {
        var ret;
        for (ret = 0; Character.isDigit(c); ++ret) {
            add();
        }
        return ret;
    }

    function string(var start) {
        buf.setLength(0);
        while (c != start) {
	        if (c == CharacterIterator.DONE) 
	        	throw new SyntaxError("Unexpected end of JSON string");

            if (c == '\\') {
                next();
                if (c == 'u') {
                    add(unicode());
                } else {
                    value = escapes.get(new Character(c));
                    if (value != null) {
                        add(((Character) value).charValue());
                    }
                }
            } else {
                add();
            }
        }
        next();

        return buf.toString();
    }

    function add(var cc) {
        buf.append(cc);
        next();
    }

    function add() {
        add(c);
    }

    function unicode() {
        var value = 0;
        for (var i = 0; i < 4; ++i) {
            switch (next()) {
            case '0': case '1': case '2': case '3': case '4': 
            case '5': case '6': case '7': case '8': case '9':
                value = (value << 4) + c - '0';
                break;
            case 'a': case 'b': case 'c': case 'd': case 'e': case 'f':
                value = (value << 4) + (c - 'a') + 10;
                break;
            case 'A': case 'B': case 'C': case 'D': case 'E': case 'F':
                value = (value << 4) + (c - 'A') + 10;
                break;
            }
        }
        return (char) value;
    }
}
};

exports.stringify = function(object){
	JSON.stringify(object, function(value){
		
	});	
};