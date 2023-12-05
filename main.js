import * as echarts from "echarts/core";
import { ScatterChart } from "echarts/charts";
import { ToolboxComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([ScatterChart, CanvasRenderer, ToolboxComponent]);

import { complex, add, pow, multiply } from "mathjs"; // use for complex operations
import {
  EigenvalueDecomposition,
  //WrapperMatrix2D,
  Matrix as Mx,
} from "ml-matrix";

import "./styles/style.scss";

//************************************************************************************************************ */
//************************************************************************************************************** */

let maxIter = 14;

// let substitutions = [
//     [4, 2],
//     [4, 3],
//     [5, 3],
//     [6, 0],
//     [7, 0],
//     [8, 0],
//     [8, 1],
//     [1],
//     [2],
//   ],
//   eigVectorIndex = 2;

let substitutions = [
    // Rauzy with 9 letters as Bressaud's paper
    [2, 4],
    [3, 4],
    [3, 5],
    [0, 6],
    [0, 7],
    [0, 8],
    [1, 8],
    [1],
    [2],
  ],
  eigVectorIndex = 2;

// let substitutions = [[1], [2], [0, 3, 0, 4, 0, 3, 0], [5], [0], [0, 3, 0]],
//   eigVectorIndex = 2; // sigma_1 from Sirvent-Sellami paper Intersection....

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

let numberOfLetters = substitutions.length;
let n = numberOfLetters;

const counts = (array, letter) => array.filter((x) => x === letter).length; // how many letters l in array

let M = Mx.zeros(n, n);
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    let count = counts(s(i), j);
    M.set(i, j, count || 0);
  }
}

let eigvInfo = new EigenvalueDecomposition(M);
// console.log("eigvInfo=", eigvInfo);

let beta1 = eigvInfo.imaginaryEigenvalues[eigVectorIndex];
let beta2 = eigvInfo.realEigenvalues[eigVectorIndex];

let beta = complex(beta1, beta2);
let normaliz = pow(beta, -maxIter);

//let matrixToPrint = Array.prototype.slice.call(eigvInfo.diagonalMatrix.data[1].slice(12), 12); //
let matrixOfEigenv = [];

// console.log(eigvInfo.diagonalMatrix.data);
for (let i = 0; i < eigvInfo.diagonalMatrix.data.length; i++) {
  matrixOfEigenv.push(eigvInfo.diagonalMatrix.data[i]);
}
console.table(eigvInfo.diagonalMatrix.data); //eigvInfo.diagonalMatrix.data

// for some reason we will use this positions for the eigenvector....

//eigvIndex = numberOfLetters-1
let gamma_real = eigvInfo.eigenvectorMatrix.transpose().to2DArray()[
  eigVectorIndex
];
let gamma_imag = eigvInfo.eigenvectorMatrix.transpose().to2DArray()[
  eigVectorIndex - 1
];

let gamma = [];

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
  return i; // i is an array here
}

// create sigma^n(i) for all i
let words = [...Array(n).keys()].map((i) => iterate(i)); //.reverse()); // n= numberOfLetters

//let fractal = [...Array(n)].map((x) => []); // creates array of arrays of size numberOfLetters

let sums = words.map((x) => {
  // sums all elements over x=words[i] for all i
  let sum = [];
  x.reduce((p, c) => {
    p = add(p, gamma[c]);
    sum.push(p);
    return p; // return p is necessary!
  }, complex(0, 0));
  return sum;
});

let fractal = sums
  .map((x) => multiply(x, normaliz)) // normalized the sums
  .map((x) => x.map((el) => [el.re, el.im])); //returns as an array

// Plot the points...

const myChart = echarts.init(document.getElementById("jxgbox"), null, {
  width: 800,
  height: 600,
});

let series = []; // define the series of the 3 fractals for options

series = fractal.map((f) => {
  return { type: "scatter", symbol: "circle", symbolSize: 6, data: f };
});

let option = {
  toolbox: {
    feature: {
      saveAsImage: { type: "png", name: "fractal1" },
    },
  },

  xAxis: {
    scale: true,
  },
  yAxis: {
    scale: true,
  },
  series, // series was defined above
};

option && myChart.setOption(option);
