
/* jshint esversion: 6 */

// (c) 2020 - 2022 Wolfram Diestel
// laŭ GPL 2.0

//const lingvoj_xml = "../cfg/lingvoj.xml";

// difinu ĉion sub nomprefikso "preferoj"

/**
 * La nomspaco 'preferoj' enhavas funkciojn kaj variablojn por
 * konservi, legi, ŝangi la preferojn de la uzanto.
 * @namespace {Function} preferoj
 */
var preferoj = function() {  
    
    var lingvoj = [];
    var seanco = {};
    var dato = Date.now();
    
    /**
     * Ŝargas la lingvo-liston de la servilo, dividas ilin en 
     * preferataj kaj aliaj kaj preparas la prezenton kiel
     * listoj en la prefero-adapata dialogo
     * @memberof preferoj
     * @inner
     */
    function load_pref_lng() {
        HTTPRequest('GET', globalThis.lingvoj_xml, {},
        function() {
            // Success!
            var parser = new DOMParser();
            var doc = parser.parseFromString(this.response,"text/xml");
            var plist = document.getElementById("pref_lng");
            var alist = document.getElementById("alia_lng");

            var selection = document.getElementById("preferoj")
                .querySelector('input[name="pref_lingvoj"]:checked').value.split('_');
            
            // kolekti la lingvojn unue, ni bezonos ordigi ilin...
            var _lingvoj = {};
            for (var e of doc.getElementsByTagName("lingvo")) {
                var c = e.attributes['kodo']; // jshint ignore:line
                if (c.value != "eo") {
                    var ascii = eo_ascii(e.textContent);
                    _lingvoj[ascii] = {lc: c.value, ln: e.textContent};
                }
            }

            for (var l of Object.keys(_lingvoj).sort()) {    
                var lc = _lingvoj[l].lc;
                var ln = _lingvoj[l].ln;
                var li = document.createElement("LI");
                li.setAttribute("data-lng",lc);
                li.setAttribute("data-la",l);
                li.appendChild(document.createTextNode(ln));

                if ( lingvoj.indexOf(lc) < 0 ) {
                    li.setAttribute("title","aldonu");
                    if (ln[0] < selection[0] || ln[0] > selection[1]) 
                        li.classList.add("kasxita");
                    alist.appendChild(li);
                } else {
                    li.setAttribute("title","forigu");
                    plist.appendChild(li);

                    var lk = li.cloneNode(true);
                    lk.setAttribute("class","kasxita");
                    alist.appendChild(lk);
                }
            }
        
            alist.addEventListener("click",aldonuLingvon);
            plist.addEventListener("click",foriguLingvon);
        });     
    }

    /**
     * Kaŝas / malkaŝas  preferatajn lingvojn post
     * unuopa adapto en la listo de aliaj lingvoj.
     * @memberof preferoj
     * @inner
     */
    function change_pref_lng() {
        var selection = document.getElementById("preferoj")
            .querySelector('input[name="pref_lingvoj"]:checked').value.split('_');

        for (var ch of document.getElementById("alia_lng").childNodes) {
            var la=ch.getAttribute("data-la");
            if (la[0] < selection[0] || la[0] > selection[1]) 
                ch.classList.add("kasxita");
            else
                ch.classList.remove("kasxita");
        }
    }

    /**
     * Reagas al evento por aldoni lingvon al preferataj
     * @memberof preferoj
     * @inner
     * @param {Event} event 
     */
    function aldonuLingvon(event) {
        var el = event.target; 

        if (el.tagName == "LI") {
            var lng = el.getAttribute("data-lng");
            if (lng) {
                //console.log("+"+lng);
                lingvoj.push(lng);
                dato = Date.now();
            }
            //el.parentElement.removeChild(el);
            document.getElementById("pref_lng").appendChild(el.cloneNode(true));
            el.classList.add("kasxita");
        }
    }

    /**
     * Reagas al evento por forigi lingvon el la preferataj
     * @memberof preferoj
     * @inner
     * @param {Event} event 
     */
    function foriguLingvon(event) {
        var el = event.target; 

        if (el.tagName == "LI") {
            var lng = el.getAttribute("data-lng");
            if (lng) {
                //console.log("-"+lng);
                // forigu elo la areo pref_lng
                var i = lingvoj.indexOf(lng);
                lingvoj.splice(i, 1);
            }
            el.parentElement.removeChild(el);
            const ela = document.getElementById("alia_lng").querySelector("[data-lng='"+lng+"'");
            ela.classList.remove("kasxita");
        }
    }


    /**
     * Prezentas dialogon kun ĉiuj difinitaj lingvoj kaj la momente
     * prefertaj por ebligi adapti tiujn.
     * @memberof preferoj
     * @param {Function} sePreta 
     */
    function dialog(sePreta) {
        var pref = document.getElementById("pref_dlg");
        var inx = [['a','b'],['c','g'],['h','j'],['k','l'],['m','o'],['p','s'],['t','z']];

        if (pref) {
            pref.classList.toggle("kasxita");
            store();
        // se ankoraŭ ne ekzistas, faru la fenestrojn por preferoj (lingvoj)
        } else {
            var dlg = ht_element("DIV",{id: "pref_dlg", class: "overlay"});
            var div = ht_element("DIV",{id: "preferoj", class: "preferoj"});
            //var tit = ht_element("H2",{title: "tiun ĉi dialogon vi povas malfermi ĉiam el la piedlinio!"},"preferoj");
            var close = ht_button("preta",function() {
                document.getElementById("pref_dlg").classList.add("kasxita");
                store();
                // adaptu la rigardon, t.e. trd-listojn
                //preparu_maletendu_sekciojn();
                sePreta();
            },"fermu preferojn");
            close.setAttribute("id","pref_dlg_close");

            var xopt = inx.map(i => { return {id: i.join('_'), label: i.join('..')}; });
            var xdiv = ht_element("DIV",{id: "w:ix_literoj", class: "tabs"});
            add_radios(xdiv,"pref_lingvoj",null,xopt,change_pref_lng);
            
            //div.appendChild(make_element("SPAN"));
            xdiv.appendChild(close);
            div.appendChild(xdiv);

            div.appendChild(ht_element("H3",{},"preferataj lingvoj"));
            div.appendChild(ht_element("H3",{},"aldoneblaj lingvoj"));
            div.appendChild(ht_element("UL",{id: "pref_lng"}));
            div.appendChild(ht_element("UL",{id: "alia_lng"}));

            //dlg.appendChild(tit)
            dlg.appendChild(div);
        
            // enigu liston de preferoj en la artikolon
            var art = document.getElementById(sec_art);
            var h1 = art.getElementsByTagName("H1")[0];           
            h1.appendChild(dlg);
        
            load_pref_lng();
        } 
    }


    /**
     * Kreas grupon de opcioj (radio), donu 
     * ilin kiel vektoro da {id,label}. Ni uzas tion por grupigi la
     * lingvoj laŭ alfabeto ĉar ni ne povas montri ciujn samtempe
     * @memberof preferoj
     * @inner
     * @param {Element} parent - la parenca elemento por la opcioj
     * @param {string} name - la nevidebla nomo (atributo 'name') 
     * @param {string|null} glabel - la videbla nomo de la grupo
     * @param {Array<{id,label}>} radios - listo de HTML-id por la opcioj
     * @param {Function} handler - reago al elekto-eventoj
     */
    function add_radios(parent,name,glabel,radios,handler) {
        if (glabel) {
            const gl = document.createElement("LABEL");
            gl.appendChild(document.createTextNode(glabel));
            parent.appendChild(gl);   
        }
        let first = true;
        if (radios) {
            for (const r of radios) {
                const span = document.createElement("SPAN");
                const input = first?
                    ht_element("INPUT",{name: name, type: "radio", id: r.id, checked: "checked", value: r.id}) :
                    ht_element("INPUT",{name: name, type: "radio", id: r.id, value: r.id});
                first = false;
                const label = ht_element("LABEL",{for: r.id}, r.label);
                span.appendChild(input);
                span.appendChild(label);
                parent.appendChild(span);
            }    
        }
        if(handler) {
            parent.addEventListener("click",handler);
        }
    }

    /**
     * Konservas valorojn de preferoj en la loka memoro de la retumilo.
     * @memberof preferoj
     */    
    function store() {
        if (lingvoj.length > 0) {
            var prefs = {};
            prefs["w:preflng"] = lingvoj;
            prefs["w:prefdat"] = dato;
            window.localStorage.setItem("revo_preferoj",JSON.stringify(prefs));     
        }
    }


    
    /**
     * Reprenas memorigitajn valorojn de preferoj el la 
     * loka memoro de la retumilo.
     * @memberof preferoj
     */
    function restore() {
        var str = window.localStorage.getItem("revo_preferoj");            
        var prefs = (str? JSON.parse(str) : null);

        var nav_lng = navigator.languages || [navigator.language];
        lingvoj = (prefs && prefs["w:preflng"])? prefs["w:preflng"] : nav_lng.slice();
        dato = (prefs && prefs["w:prefdat"])? prefs["w:prefdat"] : Date.now();
    }

    
    /**
     * Memoras staton de la seanco - forgesota 
     * kiam la seanco finiĝas/retumilo fermiĝas
     * @memberof preferoj
     * @inner
     */
    function storeSession() {
        window.sessionStorage.setItem("revo_seanco",JSON.stringify(seanco));     
    }


    /**
     * Reprenas memorigitajn valorojn de seanco el 
     * la seanco-memoro de la retumilo.
     * @memberof preferoj
     * @inner
     */
    function restoreSession() {
        var str = window.sessionStorage.getItem("revo_seanco");            
        seanco = (str? JSON.parse(str) : null);
    }

    /**
     * Redonas la kompletan lingvoliston.
     * @memberof preferoj
     * @returns la lingvolisto
     */
    function languages() {
        return lingvoj;
    }

    /**
     * Redonas la daton de la preferoj. (En la unuaj tagoj ni ebligas
     * adapti lingvojn en la traduklistoj de la sekcioj, poste plu nur en la piedlinio.)
     * @memberof preferoj
     * @returns la dato kiam ni metis la preferojn
     */
    function date() {
        return dato;
    }

    // eksportu publikajn funkciojn / variablojn
    return {
        //store: store,
        restore: restore,
        dialog: dialog,
        languages: languages,
        date: date,
        seanco: seanco
    };
    
}();
