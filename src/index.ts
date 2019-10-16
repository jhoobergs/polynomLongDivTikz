import prompt from 'prompt-sync'

interface PolynomPart {
    factor: number,
    exponent: number
}

interface Polynom {
    items: PolynomPart[]
}

const parsePolynomial: (s: string) => Polynom = (s: string) => {
    //console.log(s.replace(new RegExp('-', 'g'), '+-'))
    const splitted = s.replace(new RegExp('-', 'g'),'+-').split('+').map(p => p.replace(/\s+/,'')).filter(p => p !== '')
    //console.log(splitted)
    return { 
        items: splitted.map(p => {
            if(p.indexOf('x') === -1){
                return {
                    factor: Number.parseFloat(p),
                    exponent: 0
                }
            }
            const xSplitted = p.split('x').map(d => d.trim()).filter(d => d !== '')
            if(xSplitted.length === 0){
                return {factor: 1, exponent: 1}
            }
            else if(xSplitted.length === 1 && p.indexOf('^') === -1){
                return {
                    factor: Number.parseFloat((xSplitted[0] === '-') ? '-1' : xSplitted[0]),
                    exponent: 1
                }
            }
            else if (xSplitted.length === 1) {
                return {
                    factor: 1,
                    exponent: Number.parseFloat(xSplitted[0].substr(1))
                }
            }
            else{
                return {
                    factor: Number.parseFloat((xSplitted[0] === '-') ? '-1' : xSplitted[0]),
                    exponent: Number.parseFloat(xSplitted[1].substr(1))
                }
            }
        })
    }
}

const simplifyPolynom: (p: Polynom) => Polynom = (p: Polynom) => {
    const sorted = [...p.items].sort((p1, p2) => p2.exponent - p1.exponent)
    return { items: sorted.reduce((items: PolynomPart[], part: PolynomPart) => {
        if(items.length === 0)
            return [part]
        else if(items[items.length - 1].exponent === part.exponent){
            return [...items.slice(0, items.length - 1), { exponent: part.exponent, factor: items[items.length - 1].factor + part.factor }]
        }
        else {
            return [...items, part]
        }
    }, []).filter((part: PolynomPart) => part.factor !== 0) }
}

const allExponentPolynom: (p: Polynom) => Polynom = (p: Polynom) => {
    if(p.items.length === 0)
        return p
    const maxExponent = p.items[0].exponent
    const s_p = simplifyPolynom(p)
    return { items: Array.from({ length: maxExponent + 1 }, (v, k) => k).reverse().map(e => {
            const search = s_p.items.filter(i => i.exponent === e)
            return {
                exponent: e,
                factor: (search.length === 1) ? search[0].factor : 0
            }
        })
    }
}

const invertPolynom: (p: Polynom) => Polynom = (p: Polynom) => {
    return { items: simplifyPolynom(p).items.map(part => { return { factor: -part.factor, exponent: part.exponent} })}
}

const addPolynoms: (p1: Polynom, p2: Polynom) => Polynom = (p1: Polynom, p2: Polynom) => {
    return simplifyPolynom({ items: [...simplifyPolynom(p1).items, ...simplifyPolynom(p2).items] })
}

const subtractPolynoms: (p1: Polynom, p2: Polynom) => Polynom = (p1: Polynom, p2: Polynom) => {
    return addPolynoms(p1, invertPolynom(p2))
}

const polynomPartMultiply: (part: PolynomPart, p: Polynom) => Polynom = (part: PolynomPart, p: Polynom) => {
    return {items: p.items.map(p_part => { return { factor: part.factor * p_part.factor, exponent: part.exponent + p_part.exponent } }) }
}

const getDivisionStep: (p1: Polynom, p2: Polynom) => [PolynomPart, Polynom, Polynom] | undefined = (p1: Polynom, p2: Polynom) => {
    const s_p1 = simplifyPolynom(p1)
    const s_p2 = simplifyPolynom(p2)
    if(s_p1.items.length === 0)
        return undefined
    const exponent = s_p1.items[0].exponent - s_p2.items[0].exponent
    if(exponent < 0){
        return undefined
    }
    const factor = s_p1.items[0].factor / s_p2.items[0].factor
    const newPart = { exponent, factor }
    const subPolynom = polynomPartMultiply(newPart, s_p2)
    const newPolynom = subtractPolynoms(p1, subPolynom)

    return [newPart, subPolynom, newPolynom]
}

const printPolynom: (p: Polynom) => string = (p: Polynom) => {
    const s = p.items.map(part => {
        return `${(Math.abs(part.factor) !== 1 || part.exponent === 0) ? part.factor : (part.factor < 0) ? '-' : ''}${part.exponent !== 0 ? 'x' : ''}${(part.exponent !== 1 && part.exponent !== 0) ? `^${part.exponent}` : ''}`
    }).join('+').replace(new RegExp('\\+-','g'),'-')
    return (s === '') ? '0' : s
}

const toTex: (p1: Polynom, p2: Polynom) => string = (p1: Polynom, p2: Polynom) => {
    const s_p1 = simplifyPolynom(p1)
    const s_p2 = simplifyPolynom(p2)
    let tex: string[] = []
    const maxExponent = s_p1.items[0].exponent
    const maxHasMin = (s_p1.items[0].factor < 0)
    const width: number = (maxExponent) * 2 + (maxHasMin ? 2 : 1)
    let yIndex = 0
    tex = tex.concat(toTexPolynom(allExponentPolynom(s_p1), yIndex, maxExponent, maxHasMin)[0])
    yIndex += 1
    let step = getDivisionStep(s_p1, s_p2)
    let quotient: Polynom = { items: [] }
    let remainder: Polynom = { items: [] }
    let polynomData
    if (step) {
        polynomData = toTexPolynom(step[1], yIndex, maxExponent, maxHasMin)
        tex = tex.concat(polynomData[0])
        yIndex += 1
        tex.push(toTexDrawLine(polynomData[2], -(yIndex * 0.5) + 0.2, polynomData[1] + 0.8, -(yIndex * 0.5) + 0.2))
        tex.push(toTexDrawLine(polynomData[2] - 0.3, -(yIndex * 0.5) + 0.2, polynomData[2] - 0.1, -(yIndex * 0.5) + 0.2))
        
        tex = tex.concat(toTexPolynom(allExponentPolynom(step[2]), yIndex, maxExponent, maxHasMin)[0])
        yIndex += 1
    }
    while (step) {
        quotient.items.push(step[0])
        //console.log(printPolynom({ items: [step[0]] }))
        //console.log(printPolynom(step[1]))
        //console.log(printPolynom(step[2]))
        remainder = step[2]

        step = getDivisionStep(step[2], s_p2)
        if(step){
            polynomData = toTexPolynom(step[1], yIndex, maxExponent, maxHasMin)
            tex = tex.concat(polynomData[0])
            yIndex += 1
            tex.push(toTexDrawLine(polynomData[2], -(yIndex * 0.5) + 0.2, polynomData[1] + 0.8, -(yIndex * 0.5) + 0.2))
            tex.push(toTexDrawLine(polynomData[2] - 0.2, -(yIndex * 0.5) + 0.2, polynomData[2] - 0.05, -(yIndex * 0.5) + 0.2))

            tex = tex.concat(toTexPolynom(allExponentPolynom(step[2]), yIndex, maxExponent, maxHasMin)[0])
            yIndex += 1
        }
    }
    tex.push(toTexDrawLine(width, -0.2, width+3,-0.2))
    tex.push(toTexDrawLine(width, 0.2, width, -(0.5*(yIndex-1)+0.2)))
    tex.push(toTexMathText(width + 0.1, 0, printPolynom(s_p2)))
    tex.push(toTexMathText(width + 0.1, -0.5, printPolynom(quotient)))

    return tex.join('\n')
}

const toTexMathText = (x: number, y: number, text: string) => {
    return `\\node[anchor=west] at (${x},${y}) {$${text}$};`
}

const toTexDrawLine = (from_x: number, from_y: number, to_x: number, to_y: number) => {
    return `\\draw (${from_x},${from_y}) -- (${to_x},${to_y});`
}

const toTexPolynom: (p: Polynom, yIndex: number, maxExponent: number, maxHasMin: boolean) => [string[], number, number] = (p: Polynom, yIndex: number, maxExponent: number, maxHasMin: boolean) => {
    if(p.items.length === 0){
        p.items = [{
            factor: 0,
            exponent: 0,
        }]
    }
    const placings = p.items.map((i, idx) => {
        const part = `${Math.round(100*Math.abs(i.factor))/100}${i.exponent !== 0 ? 'x' : ''}${i.exponent > 1 ? `^${i.exponent}` : ''}`
        let index = (maxExponent - i.exponent) * 2 + ((maxHasMin) ? 0 : -1)
        if(i.exponent === maxExponent){
            if(i.factor < 0){
                return [{index, val: '-'}, {index: index + 1, val: part}]
            }
            index += 1
            return [{index, val: part}]
        }
        else if(idx === 0){
            if (i.factor < 0) {
                return [{ index, val: '-' }, { index: index + 1, val: part }]
            }
            return [{ index: index + 1, val: part }]
        }
        return [{index, val: (i.factor < 0 ? '-' : '+')}, {index: index + 1, val: part}]
    }).reduce((a, v) => [...a,...v], [])
    
    return [placings.map(i => `\\node[anchor=west] at (${i.index * 1.0},${yIndex * -0.5}) {$${i.val}$};`), placings.reduce((a, b) => Math.max(a, b.index), 0), placings.reduce((a, b) => Math.min(a, b.index), maxExponent)]
}

const round = (n: number, p: number = 2) => {
    return Math.round(Math.pow(10, p) * Math.round(n)) / Math.pow(10, p)
}

const hornertex: (p: Polynom, a: number) => string = (p: Polynom, a: number) => {
    const tex: string[] = []
    const s_p1 = simplifyPolynom(p)
    const maxExponent = s_p1.items[0].exponent
    const p1 = allExponentPolynom(s_p1)
    tex.push(toTexDrawLine(0.5,0,0.5,1.2))
    const separation = 1
    tex.push(toTexDrawLine(0.5, 0, round(1+maxExponent*separation), 0))
    const bottomHeight = 0.2
    tex.push(`\\node[anchor=west] at (${0},${bottomHeight}) {$${a}$};`)

    tex.push(...p1.items.map((it, idx) => `\\node[anchor=east] at (${round(separation*(1+idx))},${1}) {$${it.factor}$};`))

    const solHeight = -0.3
    let valuePushedDown = p1.items[0].factor
    tex.push(`\\node[anchor=east] at (${separation},${solHeight}) {$${round(valuePushedDown)}$};`)
    for(let i = 1; i <= maxExponent; i++){
        const newValue = valuePushedDown * a
        valuePushedDown = p1.items[i].factor + newValue
        tex.push(`\\node[anchor=east] at (${round(separation * (i + 1))},${bottomHeight}) {$${round(newValue)}$};`)
        tex.push(`\\node[anchor=east] at (${round(separation * (i + 1))},${solHeight}) {$${round(valuePushedDown)}$};`)
    }

    return tex.join('\n')
}

/*let p1 = parsePolynomial(prompt()('Enter the first polynomial: '));
let p2 = prompt()('Enter the second polynomial: ');*/

//let p1 = parsePolynomial('x^5 - x^3 + x^3 + x - x^2')
//let p2 = parsePolynomial('1.2 - 2x^3 + x^3 + 5x - x^2')
let p1 = parsePolynomial('3x^3+8x^2-x+1')
let p2 = parsePolynomial('3x+2')
let p3 = parsePolynomial('2x^3+x^2-5x+2')
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
console.log(hornertex(p3,3))