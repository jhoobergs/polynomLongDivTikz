# polynomLongDivTikz

- Generates tikz code for the long division of two polynoms

## Usage
Still in development.

Currently you can add to the bottom of index.ts and run `npm run start`
```
let p1 = parsePolynomial('3x^3+8x^2-x+1')
let p2 = parsePolynomial('3x+2')
console.log(toTex(p1, p2))
```