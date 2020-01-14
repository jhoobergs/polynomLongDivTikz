"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
//import prompt from 'prompt-sync'
var parsePolynomial = function (s) {
    //console.log(s.replace(new RegExp('-', 'g'), '+-'))
    var splitted = s.replace(new RegExp('-', 'g'), '+-').split('+').map(function (p) { return p.replace(/\s+/, ''); }).filter(function (p) { return p !== ''; });
    //console.log(splitted)
    return {
        items: splitted.map(function (p) {
            if (p.indexOf('x') === -1) {
                return {
                    factor: Number.parseFloat(p),
                    exponent: 0
                };
            }
            var xSplitted = p.split('x').map(function (d) { return d.trim(); }).filter(function (d) { return d !== ''; });
            if (xSplitted.length === 0) {
                return { factor: 1, exponent: 1 };
            }
            else if (xSplitted.length === 1 && p.indexOf('^') === -1) {
                return {
                    factor: Number.parseFloat((xSplitted[0] === '-') ? '-1' : xSplitted[0]),
                    exponent: 1
                };
            }
            else if (xSplitted.length === 1) {
                return {
                    factor: 1,
                    exponent: Number.parseFloat(xSplitted[0].substr(1))
                };
            }
            else {
                return {
                    factor: Number.parseFloat((xSplitted[0] === '-') ? '-1' : xSplitted[0]),
                    exponent: Number.parseFloat(xSplitted[1].substr(1))
                };
            }
        })
    };
};
var simplifyPolynom = function (p) {
    var sorted = __spreadArrays(p.items).sort(function (p1, p2) { return p2.exponent - p1.exponent; });
    return { items: sorted.reduce(function (items, part) {
            if (items.length === 0)
                return [part];
            else if (items[items.length - 1].exponent === part.exponent) {
                return __spreadArrays(items.slice(0, items.length - 1), [{ exponent: part.exponent, factor: items[items.length - 1].factor + part.factor }]);
            }
            else {
                return __spreadArrays(items, [part]);
            }
        }, []).filter(function (part) { return part.factor !== 0; }) };
};
var allExponentPolynom = function (p) {
    if (p.items.length === 0)
        return p;
    var maxExponent = p.items[0].exponent;
    var s_p = simplifyPolynom(p);
    return { items: Array.from({ length: maxExponent + 1 }, function (v, k) { return k; }).reverse().map(function (e) {
            var search = s_p.items.filter(function (i) { return i.exponent === e; });
            return {
                exponent: e,
                factor: (search.length === 1) ? search[0].factor : 0
            };
        })
    };
};
var invertPolynom = function (p) {
    return { items: simplifyPolynom(p).items.map(function (part) { return { factor: -part.factor, exponent: part.exponent }; }) };
};
var addPolynoms = function (p1, p2) {
    return simplifyPolynom({ items: __spreadArrays(simplifyPolynom(p1).items, simplifyPolynom(p2).items) });
};
var subtractPolynoms = function (p1, p2) {
    return addPolynoms(p1, invertPolynom(p2));
};
var polynomPartMultiply = function (part, p) {
    return { items: p.items.map(function (p_part) { return { factor: part.factor * p_part.factor, exponent: part.exponent + p_part.exponent }; }) };
};
var getDivisionStep = function (p1, p2) {
    var s_p1 = simplifyPolynom(p1);
    var s_p2 = simplifyPolynom(p2);
    if (s_p1.items.length === 0)
        return undefined;
    var exponent = s_p1.items[0].exponent - s_p2.items[0].exponent;
    if (exponent < 0) {
        return undefined;
    }
    var factor = s_p1.items[0].factor / s_p2.items[0].factor;
    var newPart = { exponent: exponent, factor: factor };
    var subPolynom = polynomPartMultiply(newPart, s_p2);
    var newPolynom = subtractPolynoms(p1, subPolynom);
    return [newPart, subPolynom, newPolynom];
};
var printPolynom = function (p) {
    var s = p.items.map(function (part) {
        return "" + ((Math.abs(part.factor) !== 1 || part.exponent === 0) ? part.factor : (part.factor < 0) ? '-' : '') + (part.exponent !== 0 ? 'x' : '') + ((part.exponent !== 1 && part.exponent !== 0) ? "^" + part.exponent : '');
    }).join('+').replace(new RegExp('\\+-', 'g'), '-');
    return (s === '') ? '0' : s;
};
var toTex = function (p1, p2) {
    var s_p1 = simplifyPolynom(p1);
    var s_p2 = simplifyPolynom(p2);
    var tex = [];
    var maxExponent = s_p1.items[0].exponent;
    var maxHasMin = (s_p1.items[0].factor < 0);
    var width = (maxExponent) * 2 + (maxHasMin ? 2 : 1);
    var yIndex = 0;
    tex = tex.concat(toTexPolynom(allExponentPolynom(s_p1), yIndex, maxExponent, maxHasMin)[0]);
    yIndex += 1;
    var step = getDivisionStep(s_p1, s_p2);
    var quotient = { items: [] };
    var remainder = { items: [] };
    var polynomData;
    if (step) {
        polynomData = toTexPolynom(step[1], yIndex, maxExponent, maxHasMin);
        tex = tex.concat(polynomData[0]);
        yIndex += 1;
        tex.push(toTexDrawLine(polynomData[2], -(yIndex * 0.5) + 0.2, polynomData[1] + 0.8, -(yIndex * 0.5) + 0.2));
        tex.push(toTexDrawLine(polynomData[2] - 0.3, -(yIndex * 0.5) + 0.2, polynomData[2] - 0.1, -(yIndex * 0.5) + 0.2));
        tex = tex.concat(toTexPolynom(allExponentPolynom(step[2]), yIndex, maxExponent, maxHasMin)[0]);
        yIndex += 1;
    }
    while (step) {
        quotient.items.push(step[0]);
        //console.log(printPolynom({ items: [step[0]] }))
        //console.log(printPolynom(step[1]))
        //console.log(printPolynom(step[2]))
        remainder = step[2];
        step = getDivisionStep(step[2], s_p2);
        if (step) {
            polynomData = toTexPolynom(step[1], yIndex, maxExponent, maxHasMin);
            tex = tex.concat(polynomData[0]);
            yIndex += 1;
            tex.push(toTexDrawLine(polynomData[2], -(yIndex * 0.5) + 0.2, polynomData[1] + 0.8, -(yIndex * 0.5) + 0.2));
            tex.push(toTexDrawLine(polynomData[2] - 0.2, -(yIndex * 0.5) + 0.2, polynomData[2] - 0.05, -(yIndex * 0.5) + 0.2));
            tex = tex.concat(toTexPolynom(allExponentPolynom(step[2]), yIndex, maxExponent, maxHasMin)[0]);
            yIndex += 1;
        }
    }
    tex.push(toTexDrawLine(width, -0.2, width + 3, -0.2));
    tex.push(toTexDrawLine(width, 0.2, width, -(0.5 * (yIndex - 1) + 0.2)));
    tex.push(toTexMathText(width + 0.1, 0, printPolynom(s_p2)));
    tex.push(toTexMathText(width + 0.1, -0.5, printPolynom(quotient)));
    return tex.join('\n');
};
var toTexMathText = function (x, y, text) {
    return "\\node[anchor=west] at (" + x + "," + y + ") {$" + text + "$};";
};
var toTexDrawLine = function (from_x, from_y, to_x, to_y) {
    return "\\draw (" + from_x + "," + from_y + ") -- (" + to_x + "," + to_y + ");";
};
var toTexPolynom = function (p, yIndex, maxExponent, maxHasMin) {
    if (p.items.length === 0) {
        p.items = [{
                factor: 0,
                exponent: 0
            }];
    }
    var placings = p.items.map(function (i, idx) {
        var part = "" + Math.round(100 * Math.abs(i.factor)) / 100 + (i.exponent !== 0 ? 'x' : '') + (i.exponent > 1 ? "^" + i.exponent : '');
        var index = (maxExponent - i.exponent) * 2 + ((maxHasMin) ? 0 : -1);
        if (i.exponent === maxExponent) {
            if (i.factor < 0) {
                return [{ index: index, val: '-' }, { index: index + 1, val: part }];
            }
            index += 1;
            return [{ index: index, val: part }];
        }
        else if (idx === 0) {
            if (i.factor < 0) {
                return [{ index: index, val: '-' }, { index: index + 1, val: part }];
            }
            return [{ index: index + 1, val: part }];
        }
        return [{ index: index, val: (i.factor < 0 ? '-' : '+') }, { index: index + 1, val: part }];
    }).reduce(function (a, v) { return __spreadArrays(a, v); }, []);
    return [placings.map(function (i) { return "\\node[anchor=west] at (" + i.index * 1.0 + "," + yIndex * -0.5 + ") {$" + i.val + "$};"; }), placings.reduce(function (a, b) { return Math.max(a, b.index); }, 0), placings.reduce(function (a, b) { return Math.min(a, b.index); }, maxExponent)];
};
var round = function (n, p) {
    if (p === void 0) { p = 2; }
    return Math.round(Math.pow(10, p) * Math.round(n)) / Math.pow(10, p);
};
var hornertex = function (p, a) {
    var tex = [];
    var s_p1 = simplifyPolynom(p);
    var maxExponent = s_p1.items[0].exponent;
    var p1 = allExponentPolynom(s_p1);
    tex.push(toTexDrawLine(0.5, 0, 0.5, 1.2));
    var separation = 1;
    tex.push(toTexDrawLine(0.5, 0, round(1 + maxExponent * separation), 0));
    var bottomHeight = 0.2;
    tex.push("\\node[anchor=west] at (" + 0 + "," + bottomHeight + ") {$" + a + "$};");
    tex.push.apply(tex, p1.items.map(function (it, idx) { return "\\node[anchor=east] at (" + round(separation * (1 + idx)) + "," + 1 + ") {$" + it.factor + "$};"; }));
    var solHeight = -0.3;
    var valuePushedDown = p1.items[0].factor;
    tex.push("\\node[anchor=east] at (" + separation + "," + solHeight + ") {$" + round(valuePushedDown) + "$};");
    for (var i = 1; i <= maxExponent; i++) {
        var newValue = valuePushedDown * a;
        valuePushedDown = p1.items[i].factor + newValue;
        tex.push("\\node[anchor=east] at (" + round(separation * (i + 1)) + "," + bottomHeight + ") {$" + round(newValue) + "$};");
        tex.push("\\node[anchor=east] at (" + round(separation * (i + 1)) + "," + solHeight + ") {$" + round(valuePushedDown) + "$};");
    }
    return tex.join('\n');
};
/*let p1 = parsePolynomial(prompt()('Enter the first polynomial: '));
let p2 = prompt()('Enter the second polynomial: ');*/
//let p1 = parsePolynomial('x^5 - x^3 + x^3 + x - x^2')
//let p2 = parsePolynomial('1.2 - 2x^3 + x^3 + 5x - x^2')
var p1 = parsePolynomial('3x^3+8x^2-x+1');
var p2 = parsePolynomial('3x+2');
var p3 = parsePolynomial('2x^3+x^2-5x+2');
//console.log(p1)
//console.log(printPolynom(p1))
//console.log(printPolynom(simplifyPolynom(p1)))
//console.log(p2)
//console.log(printPolynom(p2))
// console.log(printPolynom(simplifyPolynom(p2)))
// console.log(subtractPolynoms(p1, p2))
// //console.log(JSON.stringify(getDivisionStep(p1,p2)))
// let step = getDivisionStep(p1, p2)
// let quotient : Polynom = { items: []}
// let remainder: Polynom = { items: [] }
// while(step){
//     quotient.items.push(step[0])
//     console.log(printPolynom({items: [step[0]]}))
//     console.log(printPolynom(step[1]))
//     console.log(printPolynom(step[2]))
//     remainder = step[2]
//     step = getDivisionStep(step[2], p2)
// }
// console.log(`${printPolynom(p1)} / ${printPolynom(p2)} = ${printPolynom(quotient)} with remainder ${printPolynom(remainder)}`)
//console.log(simplifyPolynom(p1))
//console.log(simplifyPolynom(p1))
//console.info(`Calculating (${p1}) / (${p2})`)
//console.log(toTex(p1, p2))
//console.log(hornertex(p3,3))
//# sourceMappingURL=index.js.map