import * as echarts from "echarts/core";
import { ScatterChart } from "echarts/charts";
import { ToolboxComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([ScatterChart, CanvasRenderer, ToolboxComponent, LegendComponent]);

import { complex, add, pow, multiply} from "mathjs"; // use for complex operations
import {
  EigenvalueDecomposition,
  //WrapperMatrix2D,
  Matrix as Mx,
} from "ml-matrix";

import "./styles/style.scss";



//*************************************************************************************************************//

let maxIter = 4;


let fixedSequences = [
  // Rauzy with 9 letters as Bressaud's paper, beginning at 0
  [0, 6, 3, 6], // sigma^n(0) is a positive fixed point
  [0, 6, 4, 6],  // sigma^n(6) is negative fix point
//   // same sequences backwards are negative fixed points
//   [0, 6, 4, 6], // sigma^n(0) backwards
//   [0, 6, 3, 6],  // sigma^n(6)
 ];


 let numberOfFixedPoints = fixedSequences.length ;

 

let  substitutions = [
  [0, 6, 3, 6],
  [0, 6, 3, 6, 1, 6, 2, 5, 6, 1, 6, 3, 6],
  [0, 6, 3, 6, 1, 6, 2, 5, 6, 2, 4, 6],
  [0, 6, 3, 6, 1, 6, 3, 6],
  [0, 6, 4, 5, 6, 2, 4, 6],
  [0, 6, 4, 5, 6, 2, 5, 6, 1, 6, 3, 6],
  [0, 6, 4, 6],
];



// why calculations becomes instable for maxIter > 10 ?

let numberOfLetters = substitutions.length;
let n = numberOfLetters;

const counts = (array, letter) =>  //    Counts number of letters in array....
  array.reduce((p, c) => {
    return c === letter ? p + 1 : p;
  }, 0);
//array.filter((x) => x === letter).length; // count number of letters j in array sigma(i)

let M = Mx.zeros(n, n);  // n = numberOfLetters;
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    let count = counts(s(i), j);
    M.set(i, j, count || 0);
  }
}

console.table("M = ", M.data)
function s(i) {
  // substitution
  if (Number.isInteger(i)) {
    return substitutions[i];
  } else if (Array.isArray(i)) {
    return i.map(s).flat();
  } else {
    console.log("susbtitution should be integer or array");
    return;
  }
}

let eigvInfo = new EigenvalueDecomposition(M);
// console.log("eigvInfo=", eigvInfo);


// get all eigenvalues as complex numbers
function getEigenvalueAsArray(i) { 
  let x = eigvInfo.realEigenvalues[i]; let y = eigvInfo.imaginaryEigenvalues[i];
  return complex(x,y);
};

let eigenvalues = [...Array(n).keys()].map((i) => getEigenvalueAsArray(i)); 
// console.log("eigenvalues = ", eigenvalues.map(x=>x.format(2).toString()))
// console.log("norm of eigenvalues = ", ...eigenvalues.map(x=>x.abs()));

let firstExpansiveEigenvalue = eigenvalues.reduce((p, c, i)=> {if (c.abs(i)>1 && i>0) p=[c,i]; return p }, [0,0]);

let beta = firstExpansiveEigenvalue[0];
let eigVectorIndex = firstExpansiveEigenvalue[1];

// let beta2 = eigvInfo.imaginaryEigenvalues[eigVectorIndex]; // real and imaginary part of expanding eigenvalue
// let beta1 = eigvInfo.realEigenvalues[eigVectorIndex];

// let beta = complex(beta1, beta2);
let normaliz = pow(beta, -maxIter); // normalized the sums....

console.log("normaliz = ", normaliz.toString(), "       beta = ", beta.toString());

// console.table(eigvInfo.diagonalMatrix.data); //eigvInfo.diagonalMatrix.data

// for some reason we will use this positions for the eigenvector....

let gamma_real = eigvInfo.eigenvectorMatrix.transpose().to2DArray()[
  eigVectorIndex
];
let gamma_imag = eigvInfo.eigenvectorMatrix.transpose().to2DArray()[
  eigVectorIndex - 1
];

let gamma = [];   // define vector gamma from data

for (let i = 0; i < numberOfLetters; i++) {
  gamma[i] = complex(gamma_real[i], gamma_imag[i]);
}

function iterate(letter) {
  let i = letter;
  let count = 0;
  while (count < maxIter) {
    i = s(i);
    count++;
  }
  // console.log("W length =", i.length);
  return i; // i=[] is an array here
}


let N = numberOfFixedPoints; //   2 positive and 2 negative periodic (fixed) sequences

// create sigma^n(i) for all i

let words = [...Array(N).keys()].map((i) => iterate(fixedSequences[i]));  // n= numberOfLetters

for(let i=N/2; i<N; i++) {
  words[i] = words[i].reverse(); // reverse the sequences associated to negative sequences
}


let fractals = [...Array(N)].map((x) => []);

fractals = words.map((x, idx) => {
  // sums all elements over x=words[i] for all i
  let signal = idx > 1 ? -1 : 1; // if index > 2 multiply by -1 the vector gamma

  let sums = [];
  x.reduce((p, c) => {
    p = add(p, multiply(normaliz, multiply(signal, gamma[c]))); // if index >= 2 multiply by -1 the vector gamma
    sums.push([p.re, p.im]);
    return p; // return p is necessary!
  }, complex(0, 0));
  return sums;
});

const myChart = echarts.init(document.getElementById("jxgbox"), null, {
  width: 800,
  height: 600,
});

let series = []; // define the series of the 3 fractals for options

// series[0] = { type: "scatter", symbol: "circle", symbolSize: 6, data: fractal };

// let dataset= {
//   // Provide a set of data.
//   source: [
//     ['product', fractals[1]],
//     ['Matcha Latte', fractals[1]],
//     ['Milk Tea', fractals[1]],
//     ['Cheese Cocoa', fractals[1]],
//     ['Walnut Brownie', fractals[1]]
//   ]
// }

// series = fractals.map((f) => {
//   return {type: "scatter", symbolSize: 6}
// });

series = fractals.map((f) => {
  return { data: f, type: "scatter", symbol: "circle", symbolSize: 6 };
});

let legend = {
  data: ["Pos 1", "Neg 1"],
  backgroundColor: "#ccc",
  textStyle: {
    color: "black",
    // ...
  },
};

series = fractals.map((f, idx) => {
  return {
    data: f,
    name: legend.data[idx],
    type: "scatter",
    symbol: "circle",
    symbolSize: 6,
  };
});

let option = {
  toolbox: {
    feature: {
      saveAsImage: { type: "png", name: "fractal-dual-6-letters" },
    },
  },
  legend, // legend defined above

  xAxis: {
    scale: true,
  },
  yAxis: {
    scale: true,
  },
  series, // series was defined above
};

option && myChart.setOption(option);
